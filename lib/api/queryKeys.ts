// TanStack Query keys for RGEnterprises Business Admin

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    sales: (period?: string) => ['dashboard', 'sales', period] as const,
    activity: ['dashboard', 'activity'] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (params?: Record<string, unknown>) => ['orders', 'list', params] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    invoice: (id: string) => ['orders', 'invoice', id] as const,
  },
  products: {
    all: ['products'] as const,
    list: (params?: Record<string, unknown>) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (params?: Record<string, unknown>) => ['categories', 'list', params] as const,
  },
  brands: {
    all: ['brands'] as const,
    list: (params?: Record<string, unknown>) => ['brands', 'list', params] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    overview: (params?: Record<string, unknown>) => ['inventory', 'overview', params] as const,
    reservations: ['inventory', 'reservations'] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (params?: Record<string, unknown>) => ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
  finance: {
    summary: (period?: string) => ['finance', 'summary', period] as const,
    transactions: (params?: Record<string, unknown>) => ['finance', 'transactions', params] as const,
    refunds: (params?: Record<string, unknown>) => ['finance', 'refunds', params] as const,
  },
  reports: {
    sales: (params?: Record<string, unknown>) => ['reports', 'sales', params] as const,
    inventory: (params?: Record<string, unknown>) => ['reports', 'inventory', params] as const,
  },
  coupons: {
    all: ['coupons'] as const,
    list: (params?: Record<string, unknown>) => ['coupons', 'list', params] as const,
    detail: (id: string) => ['coupons', 'detail', id] as const,
  },
  campaigns: {
    all: ['campaigns'] as const,
    list: (params?: Record<string, unknown>) => ['campaigns', 'list', params] as const,
    detail: (id: string) => ['campaigns', 'detail', id] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    list: (status?: string) => ['reviews', 'list', status] as const,
  },
  support: {
    tickets: (params?: Record<string, unknown>) => ['support', 'tickets', params] as const,
    detail: (id: string) => ['support', 'detail', id] as const,
  },
  security: {
    sessions: ['security', 'sessions'] as const,
  },
  audit: {
    logs: (params?: Record<string, unknown>) => ['audit', 'logs', params] as const,
  },
  users: {
    all: ['users'] as const,
  },
  settings: {
    current: ['settings', 'current'] as const,
  },
  roles: {
    all: ['roles'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
  taxProfiles: {
    all: ['taxProfiles'] as const,
  },
  returnPolicies: {
    all: ['returnPolicies'] as const,
  },
  health: {
    current: ['health', 'current'] as const,
  },
} as const;
