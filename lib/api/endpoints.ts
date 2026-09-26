// Centralized API Endpoints mapping for RGEnterprises Backend
// Verified against urbannest-backend `src/api/routes/index.ts` mount points
// (2026-09) so every path below matches a real, live backend route.

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    me: '/users/me',
    logout: '/auth/logout',
    csrfToken: '/auth/csrf-token',
    changePassword: '/auth/change-password',
  },
  // Logged-in admin's own profile (My Profile page)
  profile: {
    get: '/users/me',
    update: '/users/profile',
    uploadAvatar: '/users/avatar',
    deleteAvatar: '/users/avatar',
    changePassword: '/auth/change-password',
  },
  dashboard: {
    overview: '/admin/dashboard/overview',
    sales: '/admin/dashboard/sales',
    recentOrders: '/admin/dashboard/recent-orders',
    recentUsers: '/admin/dashboard/recent-users',
    topProducts: '/admin/dashboard/top-products',
    lowStock: '/admin/dashboard/low-stock',
  },
  orders: {
    // orderRoutes is mounted at /orders (not /admin/orders); admin-only
    // methods are protected inside the route file via authorize().
    list: '/orders',
    detail: (id: string) => `/orders/${id}`,
    updateStatus: (id: string) => `/orders/${id}/status`,
    // No standalone "cancel" route for admins — cancellation is done via
    // updateStatus(id) with { status: 'CANCELLED' }.
    invoiceSend: (id: string) => `/orders/${id}/invoice/send`,
  },
  products: {
    // productRoutes is mounted at /products (not /admin/products).
    list: '/products',
    detail: (id: string) => `/products/${id}`,
    create: '/products',
    update: (id: string) => `/products/${id}`,
    delete: (id: string) => `/products/${id}`,
    // Backend has no bulk-status/bulk-delete routes for products yet;
    // bulk actions are performed client-side as parallel single calls.
  },
  categories: {
    // categoryRoutes is mounted at /categories (not /admin/categories).
    list: '/categories',
    detail: (id: string) => `/categories/${id}`,
    create: '/categories',
    update: (id: string) => `/categories/${id}`,
    delete: (id: string) => `/categories/${id}`,
  },
  brands: {
    // brandRoutes is mounted at /brand and aliased at /brands.
    list: '/brands',
    detail: (id: string) => `/brands/${id}`,
    create: '/brands',
    update: (id: string) => `/brands/${id}`,
    delete: (id: string) => `/brands/${id}`,
  },
  inventory: {
    overview: '/admin/inventory/overview',
    reservations: '/admin/inventory/reservations',
    adjust: (productId: string) => `/admin/inventory/${productId}/adjust`,
    bulkAdjust: '/admin/inventory/bulk-adjust',
  },
  warehouses: {
    list: '/admin/warehouses',
    detail: (id: string) => `/admin/warehouses/${id}`,
    create: '/admin/warehouses',
    update: (id: string) => `/admin/warehouses/${id}`,
    delete: (id: string) => `/admin/warehouses/${id}`,
  },
  customers: {
    list: '/admin/customers',
    detail: (id: string) => `/admin/customers/${id}`,
    // Generic patch — accepts any of { status, adminNotes, tags }.
    update: (id: string) => `/admin/customers/${id}`,
  },
  finance: {
    summary: '/admin/finance/summary',
    transactions: '/admin/finance/transactions',
    // There is no dedicated admin refunds endpoint; refunded orders are
    // surfaced through the returns admin list filtered by status.
    refunds: '/returns',
  },
  reports: {
    catalog: '/admin/reports',
    csv: '/admin/reports/csv',
  },
  coupons: {
    // couponRoutes is mounted at /coupons (not /admin/coupons).
    list: '/coupons',
    search: '/coupons/search',
    detail: (id: string) => `/coupons/${id}`,
    byCode: (code: string) => `/coupons/code/${code}`,
    lifecycle: (id: string) => `/coupons/${id}/lifecycle`,
    create: '/coupons',
    update: (id: string) => `/coupons/${id}`,
    deactivate: (id: string) => `/coupons/${id}/deactivate`,
    delete: (id: string) => `/coupons/${id}`,
  },
  campaigns: {
    list: '/admin/campaigns',
    detail: (id: string) => `/admin/campaigns/${id}`,
    create: '/admin/campaigns',
    update: (id: string) => `/admin/campaigns/${id}`,
    delete: (id: string) => `/admin/campaigns/${id}`,
  },
  reviews: {
    // reviewRoutes is mounted at /reviews (not /admin/reviews).
    list: '/reviews',
    updateStatus: (id: string) => `/reviews/${id}/status`,
  },
  support: {
    // adminSupportRoutes is mounted at /admin/support directly (no /tickets suffix).
    tickets: '/admin/support',
    detail: (id: string) => `/admin/support/${id}`,
    update: (id: string) => `/admin/support/${id}`,
  },
  security: {
    overview: '/admin/security',
    sessions: '/sessions',
    revokeSession: (id: string) => `/sessions/${id}`,
    revokeAllSessions: '/sessions/revoke-all',
  },
  audit: {
    logs: '/admin/audit-logs',
  },
  users: {
    list: '/admin/users',
    invite: '/admin/users',
    // Generic patch — accepts any of { role, status, permissions }.
    update: (id: string) => `/admin/users/${id}`,
  },
  settings: {
    get: '/admin/settings',
    update: '/admin/settings',
  },
  taxProfiles: {
    list: '/admin/tax-profiles',
    create: '/admin/tax-profiles',
    update: (id: string) => `/admin/tax-profiles/${id}`,
    delete: (id: string) => `/admin/tax-profiles/${id}`,
  },
  returnPolicies: {
    list: '/admin/return-policies',
    create: '/admin/return-policies',
    update: (id: string) => `/admin/return-policies/${id}`,
    delete: (id: string) => `/admin/return-policies/${id}`,
  },
  roles: {
    list: '/admin/roles',
    detail: (id: string) => `/admin/roles/${id}`,
    update: (id: string) => `/admin/roles/${id}`,
  },
  notifications: {
    list: '/admin/notifications',
    markRead: (id: string) => `/admin/notifications/${id}/read`,
    markAllRead: '/admin/notifications/read-all',
  },
  health: {
    check: '/admin/system-health',
    root: '/health',
    live: '/health/live',
    ready: '/health/ready',
  },
} as const;
