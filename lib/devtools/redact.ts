// Redaction and sanitization utility for Developer Tools
// Strictly ensures no secrets, passwords, tokens, or private credentials are displayed in UI

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /auth_token/i,
  /jwt/i,
  /cookie/i,
  /api[_-]?key/i,
  /access[_-]?key/i,
  /private[_-]?key/i,
  /credit[_-]?card/i,
  /cvv/i,
  /session/i,
  /database[_-]?url/i,
  /mongodb[_-]?uri/i,
  /redis[_-]?url/i,
  /smtp/i,
];

const REDACTED_PLACEHOLDER = '•••••••• [REDACTED]';

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function redactValue(key: string, value: unknown): unknown {
  if (isSensitiveKey(key)) {
    return REDACTED_PLACEHOLDER;
  }

  if (typeof value === 'string') {
    // Check if string looks like a JWT (header.payload.signature)
    if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(value)) {
      return REDACTED_PLACEHOLDER;
    }
    // Check if string looks like a Bearer token
    if (/^Bearer\s+[A-Za-z0-9-_.]+/i.test(value)) {
      return 'Bearer ' + REDACTED_PLACEHOLDER;
    }
    // Check if string looks like a connection string
    if (/^(mongodb(\+srv)?|redis|postgres|mysql):\/\//i.test(value)) {
      return REDACTED_PLACEHOLDER;
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactObject(item));
  }

  if (value !== null && typeof value === 'object') {
    return redactObject(value as Record<string, unknown>);
  }

  return value;
}

export function redactObject<T = unknown>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(obj)) {
        return REDACTED_PLACEHOLDER as unknown as T;
      }
      if (/^(mongodb(\+srv)?|redis|postgres|mysql):\/\//i.test(obj)) {
        return REDACTED_PLACEHOLDER as unknown as T;
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    result[k] = redactValue(k, v);
  }

  return result as unknown as T;
}

export function redactHeaders(headers: Record<string, string> | Headers): Record<string, string> {
  const result: Record<string, string> = {};

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key] = isSensitiveKey(key) ? REDACTED_PLACEHOLDER : value;
    });
  } else if (typeof headers === 'object' && headers !== null) {
    for (const [key, value] of Object.entries(headers)) {
      result[key] = isSensitiveKey(key) ? REDACTED_PLACEHOLDER : value;
    }
  }

  return result;
}
