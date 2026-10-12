/**
 * Mirror of backend src/constants/permissions.ts, used only to decide what to
 * show. The backend checks every request itself, so this can never grant access.
 *
 * Backend rule (middleware/auth.middleware.ts authorize): a route open to ADMIN
 * is open to every staff role, and the permission decides. So in this admin a
 * page or button appears exactly when the role has the permission.
 */

export const PERMISSIONS = {
  PRODUCTS_READ: 'products.read',
  PRODUCTS_WRITE: 'products.write',
  ORDERS_READ: 'orders.read',
  ORDERS_WRITE: 'orders.write',
  ORDERS_REFUND: 'orders.refund',
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
  INVENTORY_READ: 'inventory.read',
  INVENTORY_WRITE: 'inventory.write',
  PAYMENTS_READ: 'payments.read',
  PAYMENTS_WRITE: 'payments.write',
  RETURNS_READ: 'returns.read',
  RETURNS_WRITE: 'returns.write',
  SHIPPING_READ: 'shipping.read',
  SHIPPING_WRITE: 'shipping.write',
  REVIEWS_READ: 'reviews.read',
  REVIEWS_WRITE: 'reviews.write',
  COUPONS_READ: 'coupons.read',
  COUPONS_WRITE: 'coupons.write',
  REPORTS_READ: 'reports.read',
  FINANCE_RECONCILE: 'finance.reconcile',
  SETTINGS_READ: 'settings.read',
  SETTINGS_WRITE: 'settings.write',
  ADMIN_USERS_READ: 'admin.users.read',
  ADMIN_USERS_WRITE: 'admin.users.write',
  WAREHOUSE_READ: 'warehouse.read',
  WAREHOUSE_WRITE: 'warehouse.write',
  MARKETING_READ: 'marketing.read',
  MARKETING_WRITE: 'marketing.write',
  SUPPORT_READ: 'support.read',
  SUPPORT_WRITE: 'support.write',
  SECURITY_READ: 'security.read',
  AUDIT_READ: 'audit.read',
  INTEGRATIONS_READ: 'integrations.read',
  DEVELOPER_TOOLS_READ: 'developer.tools.read',
  DEVELOPER_TOOLS_WRITE: 'developer.tools.write',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Staff roles that may sign in to this admin (backend ADMIN_MANAGED_ROLES). */
export const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'ORDER_MANAGER',
  'PRODUCT_MANAGER',
  'INVENTORY_MANAGER',
  'RETURN_MANAGER',
  'MARKETING_MANAGER',
  'SUPPORT_AGENT',
  'FINANCE_MANAGER',
  'DEVELOPER',
  'PAYMENT_MANAGER',
  'SHIPPING_MANAGER',
  'WAREHOUSE_MANAGER',
  'SECURITY_AUDITOR',
  'REPORTING_ANALYST',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Owner',
  ADMIN: 'Store manager',
  ORDER_MANAGER: 'Orders & packing',
  PRODUCT_MANAGER: 'Catalog manager',
  INVENTORY_MANAGER: 'Stock & warehouse',
  RETURN_MANAGER: 'Returns & refunds',
  MARKETING_MANAGER: 'Marketing',
  SUPPORT_AGENT: 'Customer support',
  FINANCE_MANAGER: 'Accounts',
  DEVELOPER: 'Developer',
  PAYMENT_MANAGER: 'Payments',
  SHIPPING_MANAGER: 'Shipping',
  WAREHOUSE_MANAGER: 'Warehouse',
  SECURITY_AUDITOR: 'Security auditor',
  REPORTING_ANALYST: 'Reporting analyst',
};

const P = PERMISSIONS;
const DEVELOPER_PERMISSIONS: Permission[] = [P.DEVELOPER_TOOLS_READ, P.DEVELOPER_TOOLS_WRITE];
const ALL_BUSINESS = (Object.values(P) as Permission[]).filter((permission) => !permission.startsWith('developer.'));

const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  SUPER_ADMIN: Object.values(P) as Permission[],
  ADMIN: ALL_BUSINESS,
  ORDER_MANAGER: [P.ORDERS_READ, P.ORDERS_WRITE, P.PAYMENTS_READ, P.SHIPPING_READ, P.SHIPPING_WRITE, P.WAREHOUSE_READ, P.PRODUCTS_READ, P.INVENTORY_READ, P.RETURNS_READ],
  PRODUCT_MANAGER: [P.PRODUCTS_READ, P.PRODUCTS_WRITE, P.REVIEWS_READ, P.REVIEWS_WRITE, P.INVENTORY_READ],
  INVENTORY_MANAGER: [P.INVENTORY_READ, P.INVENTORY_WRITE, P.PRODUCTS_READ, P.ORDERS_READ, P.WAREHOUSE_READ, P.WAREHOUSE_WRITE],
  RETURN_MANAGER: [P.RETURNS_READ, P.RETURNS_WRITE, P.ORDERS_READ, P.ORDERS_REFUND, P.PAYMENTS_READ, P.INVENTORY_READ, P.INVENTORY_WRITE],
  MARKETING_MANAGER: [P.MARKETING_READ, P.MARKETING_WRITE, P.COUPONS_READ, P.COUPONS_WRITE, P.REVIEWS_READ, P.REPORTS_READ],
  SUPPORT_AGENT: [P.USERS_READ, P.ORDERS_READ, P.RETURNS_READ, P.SHIPPING_READ, P.PAYMENTS_READ, P.SUPPORT_READ, P.SUPPORT_WRITE],
  FINANCE_MANAGER: [P.PAYMENTS_READ, P.PAYMENTS_WRITE, P.ORDERS_READ, P.ORDERS_REFUND, P.RETURNS_READ, P.REPORTS_READ, P.FINANCE_RECONCILE],
  DEVELOPER: DEVELOPER_PERMISSIONS,
  PAYMENT_MANAGER: [P.PAYMENTS_READ, P.PAYMENTS_WRITE, P.ORDERS_READ, P.ORDERS_REFUND, P.RETURNS_READ, P.REPORTS_READ, P.FINANCE_RECONCILE],
  SHIPPING_MANAGER: [P.SHIPPING_READ, P.SHIPPING_WRITE, P.ORDERS_READ, P.INVENTORY_READ, P.WAREHOUSE_READ, P.WAREHOUSE_WRITE],
  WAREHOUSE_MANAGER: [P.WAREHOUSE_READ, P.WAREHOUSE_WRITE, P.INVENTORY_READ, P.INVENTORY_WRITE, P.ORDERS_READ, P.SHIPPING_READ, P.SHIPPING_WRITE],
  SECURITY_AUDITOR: [P.SECURITY_READ, P.AUDIT_READ, P.INTEGRATIONS_READ, P.REPORTS_READ],
  REPORTING_ANALYST: [P.REPORTS_READ, P.INVENTORY_READ, P.ORDERS_READ, P.PAYMENTS_READ, P.RETURNS_READ, P.SHIPPING_READ],
};

export function isAdminRole(role: string): role is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/** Same rule as backend roleHasPermission(). */
export function roleHasPermission(
  role: string,
  permission: Permission,
  explicitPermissions: readonly string[] = [],
  permissionsConfigured = false
): boolean {
  if (permission.startsWith('developer.') && role !== 'SUPER_ADMIN' && role !== 'DEVELOPER') return false;
  if (role === 'SUPER_ADMIN') return true;
  if (permissionsConfigured) return explicitPermissions.includes(permission);
  if (explicitPermissions.length > 0) return explicitPermissions.includes(permission);
  return isAdminRole(role) ? ROLE_PERMISSIONS[role].includes(permission) : false;
}

/**
 * Roles the owner can give from the Team page, one per kind of job in the
 * business. The other backend roles still work for existing accounts.
 */
export const ASSIGNABLE_ROLES: readonly AdminRole[] = [
  'ADMIN',
  'ORDER_MANAGER',
  'PRODUCT_MANAGER',
  'INVENTORY_MANAGER',
  'RETURN_MANAGER',
  'MARKETING_MANAGER',
  'SUPPORT_AGENT',
  'FINANCE_MANAGER',
  'DEVELOPER',
];

const AREAS: Array<{ label: string; when: (has: (p: Permission) => boolean) => boolean }> = [
  { label: 'Process and ship orders', when: (has) => has(P.ORDERS_WRITE) && has(P.SHIPPING_WRITE) },
  { label: 'View orders', when: (has) => has(P.ORDERS_READ) && !(has(P.ORDERS_WRITE) && has(P.SHIPPING_WRITE)) },
  { label: 'Handle returns', when: (has) => has(P.RETURNS_WRITE) },
  { label: 'Give refunds', when: (has) => has(P.ORDERS_REFUND) },
  { label: 'Edit products, categories and brands', when: (has) => has(P.PRODUCTS_WRITE) },
  { label: 'Change stock', when: (has) => has(P.INVENTORY_WRITE) },
  { label: 'Manage pickup locations', when: (has) => has(P.WAREHOUSE_WRITE) },
  { label: 'View customers', when: (has) => has(P.USERS_READ) },
  { label: 'Moderate reviews', when: (has) => has(P.REVIEWS_WRITE) },
  { label: 'Coupons', when: (has) => has(P.COUPONS_WRITE) },
  { label: 'Sales dashboard', when: (has) => has(P.REPORTS_READ) },
  { label: 'Profit and GST reports', when: (has) => has(P.FINANCE_RECONCILE) },
  { label: 'Store settings', when: (has) => has(P.SETTINGS_WRITE) },
  { label: 'Developer tools', when: (has) => has(P.DEVELOPER_TOOLS_READ) },
];

/** Plain-language list of what a role can do, built from the same permissions the backend uses. */
export function roleAreas(role: AdminRole): string[] {
  if (role === 'SUPER_ADMIN') return ['Everything, including staff accounts and developer tools'];
  if (role === 'ADMIN') return ['Everything in the store except staff accounts and developer tools'];
  const has = (permission: Permission) => roleHasPermission(role, permission);
  return AREAS.filter((area) => area.when(has)).map((area) => area.label);
}
