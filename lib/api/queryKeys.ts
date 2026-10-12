// TanStack Query cache keys. Invalidating a parent key (e.g. orders.all)
// refreshes every list and detail under it.

export const queryKeys = {
  profile: ['profile'] as const,
  search: (q: string) => ['search', q] as const,
  couriers: ['couriers'] as const,
  developer: {
    diagnostics: (deep: boolean) => ['developer', 'diagnostics', deep] as const,
    overview: ['developer', 'overview'] as const,
    logs: ['developer', 'logs'] as const,
    jobs: ['developer', 'jobs'] as const,
    database: (collection: string, search: string) => ['developer', 'database', collection, search] as const,
    maintenance: ['developer', 'maintenance'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    overview: ['dashboard', 'overview'] as const,
    sales: (period: string) => ['dashboard', 'sales', period] as const,
    topProducts: ['dashboard', 'top-products'] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (params: Record<string, unknown>) => ['orders', 'list', params] as const,
    counts: ['orders', 'counts'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    shipments: (id: string) => ['orders', 'shipments', id] as const,
  },
  returns: {
    all: ['returns'] as const,
    list: (params: Record<string, unknown>) => ['returns', 'list', params] as const,
  },
  products: {
    all: ['products'] as const,
    list: (params: Record<string, unknown>) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  categories: ['categories'] as const,
  brands: ['brands'] as const,
  catalogConfig: {
    attributes: (categoryId: string) => ['catalog-config', 'attributes', categoryId] as const,
    taxProfiles: ['catalog-config', 'tax-profiles'] as const,
    returnPolicies: (categoryId: string) => ['catalog-config', 'return-policies', categoryId] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    list: (params: Record<string, unknown>) => ['inventory', 'list', params] as const,
  },
  warehouses: ['warehouses'] as const,
  banners: ['banners'] as const,
  customers: {
    all: ['customers'] as const,
    list: (params: Record<string, unknown>) => ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
  reviews: ['reviews'] as const,
  coupons: ['coupons'] as const,
  reports: {
    profit: (from: string, to: string) => ['reports', 'profit', from, to] as const,
    gst: (from: string, to: string) => ['reports', 'gst', from, to] as const,
  },
  settings: ['settings'] as const,
  staff: ['staff'] as const,
} as const;
