import {
  BarChart3,
  Bookmark,
  Boxes,
  Image as ImageIcon,
  LayoutDashboard,
  Package,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  TicketPercent,
  Users,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { PERMISSIONS, type Permission } from '@/lib/auth/permissions';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Needed to see the item. */
  permission?: Permission;
  /** Shown when the role has at least one of these. */
  anyOf?: Permission[];
  /** Only the owner (SUPER_ADMIN) can manage this. */
  ownerOnly?: boolean;
  /** Match only this exact path (used for the dashboard). */
  exact?: boolean;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  { items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true }] },
  {
    title: 'Sales',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingCart, permission: PERMISSIONS.ORDERS_READ },
      { label: 'Returns & refunds', href: '/admin/returns', icon: RotateCcw, permission: PERMISSIONS.RETURNS_READ },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', href: '/admin/products', icon: Package, permission: PERMISSIONS.PRODUCTS_READ },
      { label: 'Categories', href: '/admin/categories', icon: Tag, permission: PERMISSIONS.PRODUCTS_READ },
      { label: 'Brands', href: '/admin/brands', icon: Bookmark, permission: PERMISSIONS.PRODUCTS_READ },
      { label: 'Inventory', href: '/admin/inventory', icon: Boxes, permission: PERMISSIONS.INVENTORY_READ },
      { label: 'Warehouses', href: '/admin/warehouses', icon: Warehouse, permission: PERMISSIONS.WAREHOUSE_READ },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: Users, permission: PERMISSIONS.USERS_READ },
      { label: 'Reviews', href: '/admin/reviews', icon: Star, permission: PERMISSIONS.REVIEWS_READ },
      { label: 'Coupons', href: '/admin/coupons', icon: TicketPercent, permission: PERMISSIONS.COUPONS_READ },
      { label: 'Home banners', href: '/admin/banners', icon: ImageIcon, permission: PERMISSIONS.MARKETING_READ },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: BarChart3, permission: PERMISSIONS.FINANCE_RECONCILE },
      { label: 'Settings', href: '/admin/settings', icon: Settings, anyOf: [PERMISSIONS.SETTINGS_READ, PERMISSIONS.WAREHOUSE_WRITE, PERMISSIONS.PRODUCTS_WRITE] },
      { label: 'Team & roles', href: '/admin/team', icon: ShieldCheck, ownerOnly: true },
      { label: 'Developer tools', href: '/admin/developer', icon: Wrench, permission: PERMISSIONS.DEVELOPER_TOOLS_READ },
    ],
  },
];

/** Bottom bar on phones: the four most used places plus "More". */
export const MOBILE_TABS = ['/admin', '/admin/orders', '/admin/products', '/admin/customers'];

export function isActivePath(pathname: string, item: Pick<NavItem, 'href' | 'exact'>): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
