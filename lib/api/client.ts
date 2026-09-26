// Centralized API client for RGEnterprises Backend communication
import { z } from 'zod';

export type ApiErrorCode =
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

export interface RequestOptions<T = unknown> extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  schema?: z.ZodType<T>;
  _isRetry?: boolean;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions<T> = {}): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/backend';
  const { params, body, headers = {}, method = 'GET', schema, _isRetry = false, ...rest } = options;

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

        // Parse validation field errors if returned (common in 422 responses)
        if (obj.errors && typeof obj.errors === 'object') {
          fieldErrors = obj.errors as Record<string, string[]>;
        } else if (obj.fieldErrors && typeof obj.fieldErrors === 'object') {
          fieldErrors = obj.fieldErrors as Record<string, string[]>;
        }
      }
    } catch {
      // Non-JSON response body
    }

    let code: ApiErrorCode = 'UNKNOWN';

    switch (response.status) {
      case 401: {
        code = 'UNAUTHORIZED';
        cachedCsrfToken = null;
        errorMessage = 'Your session has expired or you are unauthenticated. Please sign in again.';
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
