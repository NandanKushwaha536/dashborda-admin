/**
 * Normalize backend list responses into a real array.
 * Supports direct arrays, {data: []}, paginated {data: {data: []}},
 * and common named list properties without hiding malformed responses.
 */
export function normalizeList<T>(response: unknown, aliases: string[] = []): T[] {
  if (Array.isArray(response)) return response as T[];
  if (!response || typeof response !== 'object') return [];

  const object = response as Record<string, unknown>;
  const keys = [...aliases, 'data', 'items', 'results', 'records'];

  for (const key of keys) {
    const value = object[key];
    if (Array.isArray(value)) return value as T[];
  }

  for (const key of keys) {
    const value = object[key];
    if (value && typeof value === 'object') {
      const nested = normalizeList<T>(value, aliases);
      if (nested.length > 0 || Array.isArray((value as Record<string, unknown>).data)) {
        return nested;
      }
    }
  }

  return [];
}

export function normalizeTotal(response: unknown, fallback: number): number {
  if (!response || typeof response !== 'object') return fallback;
  const object = response as Record<string, unknown>;
  if (typeof object.total === 'number') return object.total;
  const data = object.data;
  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>;
    if (typeof nested.total === 'number') return nested.total;
    const meta = nested.meta;
    if (meta && typeof meta === 'object' && typeof (meta as Record<string, unknown>).total === 'number') {
      return Number((meta as Record<string, unknown>).total);
    }
  }
  return fallback;
}

export function normalizePage(response: unknown, fallback: number): number {
  if (!response || typeof response !== 'object') return fallback;
  const object = response as Record<string, unknown>;
  if (typeof object.page === 'number') return object.page;
  const data = object.data;
  if (data && typeof data === 'object' && typeof (data as Record<string, unknown>).page === 'number') {
    return (data as Record<string, unknown>).page as number;
  }
  if (data && typeof data === 'object') {
    const meta = (data as Record<string, unknown>).meta;
    if (meta && typeof meta === 'object' && typeof (meta as Record<string, unknown>).page === 'number') return Number((meta as Record<string, unknown>).page);
  }
  return fallback;
}

export function normalizeLimit(response: unknown, fallback: number): number {
  if (!response || typeof response !== 'object') return fallback;
  const object = response as Record<string, unknown>;
  if (typeof object.limit === 'number') return object.limit;
  const data = object.data;
  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>;
    if (typeof nested.limit === 'number') return nested.limit;
    const meta = nested.meta;
    if (meta && typeof meta === 'object' && typeof (meta as Record<string, unknown>).limit === 'number') return Number((meta as Record<string, unknown>).limit);
  }
  return fallback;
}
