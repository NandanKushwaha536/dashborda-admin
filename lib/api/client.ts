// Centralized API client for RGEnterprises Backend communication
import { z } from 'zod';

type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE'
  | 'CSRF_ERROR'
  | 'SCHEMA_MISMATCH'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  fieldErrors?: Record<string, string[]>;
  data?: unknown;

  constructor(
    message: string,
    status: number,
    code: ApiErrorCode = 'UNKNOWN',
    fieldErrors?: Record<string, string[]>,
    data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.data = data;
  }
}

let cachedCsrfToken: string | null = null;
let isFetchingCsrf = false;

async function fetchCsrfToken(baseUrl: string): Promise<string | null> {
  if (cachedCsrfToken) return cachedCsrfToken;
  if (isFetchingCsrf) {
    // Wait briefly if already fetching
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (cachedCsrfToken) return cachedCsrfToken;
  }

  isFetchingCsrf = true;
  try {
    const res = await fetch(`${baseUrl}/auth/csrf-token`, {
      method: 'GET',
      credentials: 'include',
    });
    if (res.ok) {
      const json = (await res.json()) as { csrfToken?: string; data?: { csrfToken?: string } };
      cachedCsrfToken = json.csrfToken || json.data?.csrfToken || null;
      return cachedCsrfToken;
    }
  } catch {
    // Backend may not require CSRF or CSRF endpoint not configured yet
  } finally {
    isFetchingCsrf = false;
  }
  return null;
}

interface RequestOptions<T = unknown> extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  schema?: z.ZodType<T>;
  _isRetry?: boolean;
  _isAuthRetry?: boolean;
}

// One refresh at a time: parallel requests that hit 401 share the same attempt,
// so a rotated refresh token is never presented twice.
let refreshSessionPromise: Promise<boolean> | null = null;

function refreshSession(baseUrl: string): Promise<boolean> {
  if (refreshSessionPromise) return refreshSessionPromise;
  refreshSessionPromise = (async () => {
    try {
      const token = await fetchCsrfToken(baseUrl);
      const res = await fetch(`${baseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: token ? { 'X-CSRF-Token': token } : {},
        credentials: 'include',
        cache: 'no-store',
      });
      // The refresh issues a new CSRF cookie; fetch a matching token next time.
      cachedCsrfToken = null;
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshSessionPromise = null;
    }
  })();
  return refreshSessionPromise;
}

const NO_REFRESH_ENDPOINTS = ['/auth/login', '/auth/step-up', '/auth/refresh-token', '/auth/logout'];

/** Browser requests go through this app's /api/backend proxy unless overridden. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/backend';

async function apiClient<T>(endpoint: string, options: RequestOptions<T> = {}): Promise<T> {
  const baseUrl = API_BASE_URL;
  const { params, body, headers = {}, method = 'GET', schema, _isRetry = false, _isAuthRetry = false, ...rest } = options;

  let url = `${baseUrl}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const reqHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  const upperMethod = method.toUpperCase();
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(upperMethod);

  // Backend routes for orders / payments / shipments require an Idempotency-Key.
  // Generate one per request unless the caller supplied its own.
  if (isMutation && !reqHeaders['Idempotency-Key'] && !reqHeaders['idempotency-key']) {
    reqHeaders['Idempotency-Key'] =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `adm_${crypto.randomUUID()}`
        : `adm_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  }

  // Attach CSRF token on mutating requests
  if (isMutation) {
    const token = await fetchCsrfToken(baseUrl);
    if (token) {
      reqHeaders['X-CSRF-Token'] = token;
    }
  }

  let finalBody: BodyInit | undefined = undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      finalBody = body;
    } else {
      reqHeaders['Content-Type'] = 'application/json';
      finalBody = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: reqHeaders,
      credentials: 'include', // Ensures session cookie is transmitted
      body: finalBody,
      ...rest,
    });
  } catch (netErr) {
    throw new ApiError(
      'Network connection failure or backend unreachable. Please verify network connectivity.',
      0,
      'NETWORK_ERROR',
      undefined,
      netErr
    );
  }

  // Handle CSRF Token expiration / failure retry: retry only ONCE
  if (
    !response.ok &&
    (response.status === 403 || response.status === 419) &&
    isMutation &&
    !_isRetry
  ) {
    let errText = '';
    try {
      const clone = response.clone();
      const errJson = await clone.json();
      errText = JSON.stringify(errJson).toLowerCase();
    } catch {
      // Ignored
    }

    if (errText.includes('csrf') || response.status === 419) {
      // Invalidate cached token and retry once
      cachedCsrfToken = null;
      return apiClient<T>(endpoint, { ...options, _isRetry: true });
    }
  }

  // Access token expired: refresh the session once, then repeat the request.
  if (
    response.status === 401 &&
    !_isAuthRetry &&
    !NO_REFRESH_ENDPOINTS.some((prefix) => endpoint.startsWith(prefix))
  ) {
    if (await refreshSession(baseUrl)) {
      return apiClient<T>(endpoint, { ...options, _isAuthRetry: true });
    }
  }

  if (!response.ok) {
    let errorData: unknown = null;
    let errorMessage = `API request failed with status ${response.status}`;
    let fieldErrors: Record<string, string[]> | undefined = undefined;

    try {
      errorData = await response.json();
      if (typeof errorData === 'object' && errorData !== null) {
        const obj = errorData as Record<string, unknown>;
        if (typeof obj.message === 'string') {
          errorMessage = obj.message;
        } else if (typeof obj.error === 'string') {
          errorMessage = obj.error;
        }

        // Field errors: backend validate() sends { data: { fieldErrors, formErrors } } (zod flatten).
        const nested = obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : null;
        if (obj.errors && typeof obj.errors === 'object') {
          fieldErrors = obj.errors as Record<string, string[]>;
        } else if (obj.fieldErrors && typeof obj.fieldErrors === 'object') {
          fieldErrors = obj.fieldErrors as Record<string, string[]>;
        } else if (nested?.fieldErrors && typeof nested.fieldErrors === 'object') {
          fieldErrors = nested.fieldErrors as Record<string, string[]>;
        }
        // Prefer the first specific reason over a generic "Validation failed".
        const firstField = fieldErrors ? Object.entries(fieldErrors).find(([, messages]) => Array.isArray(messages) && messages.length > 0) : undefined;
        const formErrors = Array.isArray(nested?.formErrors) ? (nested!.formErrors as unknown[]).filter((m): m is string => typeof m === 'string') : [];
        if (firstField) {
          errorMessage = `${firstField[0].replace(/^body\./, '')}: ${firstField[1][0]}`;
        } else if (formErrors.length > 0) {
          errorMessage = formErrors[0];
        }
      }
    } catch {
      // Non-JSON response body
    }

    let code: ApiErrorCode = 'UNKNOWN';

    switch (response.status) {
      case 400:
        code = 'VALIDATION_ERROR';
        break;
      case 401: {
        code = 'UNAUTHORIZED';
        // Login and password re-check return 401 for a wrong password; that is
        // not an expired session, so keep the user on the page with the reason.
        if (endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/step-up') || endpoint.startsWith('/auth/logout')) {
          break;
        }
        cachedCsrfToken = null;
        errorMessage = 'Your session has expired. Please sign in again.';
        if (typeof window !== 'undefined') {
          // Fire event so auth provider can synchronize immediately
          window.dispatchEvent(new CustomEvent('rg:auth-unauthorized'));
          // Invalidate cookie session state and redirect to login preserving destination
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
        break;
      }
      case 403:
        code = 'FORBIDDEN';
        if (!errorMessage || errorMessage.includes('status 403')) {
          errorMessage = 'Access denied: You do not have permission to execute this administrative operation.';
        }
        break;
      case 404:
        code = 'NOT_FOUND';
        if (!errorMessage || errorMessage.includes('status 404')) {
          errorMessage = 'The requested resource could not be found.';
        }
        break;
      case 409:
        code = 'CONFLICT';
        if (!errorMessage || errorMessage.includes('status 409')) {
          errorMessage = 'Conflict detected: A record with these unique attributes already exists or was modified concurrently.';
        }
        break;
      case 422:
        code = 'VALIDATION_ERROR';
        if (!errorMessage || errorMessage.includes('status 422')) {
          errorMessage = 'Validation failed: Please inspect the highlighted form fields.';
        }
        break;
      case 429:
        code = 'RATE_LIMITED';
        errorMessage = 'Too many requests sent. Please pause and try again in a few moments.';
        break;
      case 500:
        code = 'SERVER_ERROR';
        errorMessage = 'An internal backend error occurred. Operations team has been notified.';
        break;
      case 502:
        code = 'BAD_GATEWAY';
        errorMessage = 'Backend service gateway error. Please verify backend service status.';
        break;
      case 503:
        code = 'SERVICE_UNAVAILABLE';
        errorMessage = 'Backend service is temporarily unavailable or undergoing maintenance.';
        break;
      default:
        code = 'UNKNOWN';
    }

    throw new ApiError(errorMessage, response.status, code, fieldErrors, errorData);
  }

  // If 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (err) {
    throw new ApiError('Failed to parse backend JSON response', response.status, 'SERVER_ERROR', undefined, err);
  }

  // Runtime Zod Schema Validation
  if (schema) {
    const parseResult = schema.safeParse(json);
    if (!parseResult.success) {
      console.warn(`[Zod Contract Mismatch] ${endpoint}:`, parseResult.error.format());
      // Return parsed data if lenient or surface descriptive error
      // To prevent silent data corruption:
      throw new ApiError(
        `Backend response does not conform to expected schema for ${endpoint}: ${parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        response.status,
        'SCHEMA_MISMATCH',
        undefined,
        parseResult.error.format()
      );
    }
    return parseResult.data as T;
  }

  return json as T;
}

export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions<T>, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions<T>, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions<T>, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions<T>, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions<T>, 'method'>) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
