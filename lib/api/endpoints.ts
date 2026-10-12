// Backend API paths used by the admin. Each one matches a route in the backend's
// src/api/routes (mounted under /api/v1). Keep this the only place paths live.

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/users/me',
    csrfToken: '/auth/csrf-token',
    changePassword: '/auth/change-password',
    /** Re-enter the password to get a 10-minute token for refunds and staff changes. */
    stepUp: '/auth/step-up',
  },
  search: '/admin/search',
  developer: {
    diagnostics: '/admin/developer-tools/diagnostics',
    overview: '/admin/developer-tools/overview',
    logs: '/admin/developer-tools/logs',
    jobs: '/admin/developer-tools/queue/jobs',
    database: '/admin/developer-tools/database',
    clearCache: '/admin/developer-tools/cache/clear',
    retryJob: '/admin/developer-tools/queue/retry',
    retryFailed: '/admin/developer-tools/queue/retry-failed',
    expireReservations: '/admin/developer-tools/inventory/expire-reservations',
    maintenance: '/admin/developer-tools/maintenance',
    publicSettings: '/store-settings/public',
  },
  profile: {
    update: '/users/profile',
    avatar: '/users/avatar',
  },
  dashboard: {
    overview: '/admin/dashboard/overview',
    sales: '/admin/dashboard/sales',
    topProducts: '/admin/dashboard/top-products',
    lowStock: '/admin/dashboard/low-stock',
  },
  orders: {
    list: '/orders',
    statusCounts: '/orders/stats/status-counts',
    detail: (id: string) => `/orders/${id}`,
    updateStatus: (id: string) => `/orders/${id}/status`,
    notes: (id: string) => `/orders/${id}/notes`,
    paymentStatus: (id: string) => `/orders/${id}/payment-status`,
    invoiceSend: (id: string) => `/orders/${id}/invoice/send`,
    retryCancellationRefund: (id: string) => `/orders/${id}/cancellation-refund/retry`,
  },
  shipments: {
    list: '/shipping',
    fromOrder: '/shipping/from-order',
    status: (id: string) => `/shipping/${id}/status`,
    tracking: (id: string) => `/shipping/${id}/tracking`,
    couriers: '/shipping/couriers',
  },
  returns: {
    list: '/returns',
    status: (id: string) => `/returns/${id}/status`,
    refund: (id: string) => `/returns/${id}/refund`,
  },
  products: {
    list: '/products',
    detail: (id: string) => `/products/${id}`,
    create: '/products',
    update: (id: string) => `/products/${id}`,
    delete: (id: string) => `/products/${id}`,
  },
  categories: {
    list: '/categories',
    create: '/categories',
    update: (id: string) => `/categories/${id}`,
    delete: (id: string) => `/categories/${id}`,
  },
  brands: {
    list: '/brands',
    create: '/brands',
    update: (id: string) => `/brands/${id}`,
    delete: (id: string) => `/brands/${id}`,
  },
  catalogConfig: {
    attributes: '/admin/catalog-config/attributes',
    taxProfiles: '/admin/catalog-config/tax-profiles',
    taxProfile: (id: string) => `/admin/catalog-config/tax-profiles/${id}`,
    returnPolicies: '/admin/catalog-config/return-policies',
  },
  inventory: {
    overview: '/admin/inventory/overview',
    adjust: (productId: string) => `/admin/inventory/${productId}/adjust`,
  },
  banners: {
    list: '/admin/campaigns',
    create: '/admin/campaigns',
    update: (id: string) => `/admin/campaigns/${id}`,
    remove: (id: string) => `/admin/campaigns/${id}`,
    image: '/admin/campaigns/banner-image',
  },
  warehouses: {
    list: '/admin/operations/warehouses',
    create: '/admin/operations/warehouses',
    update: (id: string) => `/admin/operations/warehouses/${id}`,
    remove: (id: string) => `/admin/operations/warehouses/${id}`,
  },
  customers: {
    list: '/admin/customers',
    detail: (id: string) => `/admin/customers/${id}`,
    update: (id: string) => `/admin/customers/${id}`,
  },
  reviews: {
    list: '/reviews',
    updateStatus: (id: string) => `/reviews/${id}/status`,
  },
  coupons: {
    list: '/coupons',
    create: '/coupons',
    update: (id: string) => `/coupons/${id}`,
    deactivate: (id: string) => `/coupons/${id}/deactivate`,
    delete: (id: string) => `/coupons/${id}`,
  },
  reports: {
    csv: '/admin/reports/csv',
    profit: '/admin/reports/profit',
    gst: '/admin/reports/gst',
  },
  settings: {
    get: '/admin/settings',
    update: '/admin/settings',
  },
  staff: {
    list: '/admin/users',
    create: '/admin/users',
    update: (id: string) => `/admin/users/${id}`,
  },
} as const;
