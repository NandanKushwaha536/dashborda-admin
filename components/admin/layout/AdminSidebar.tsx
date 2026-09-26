'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Bookmark,
  Boxes,
  Users,
  BadgePercent,
  Star,
  LifeBuoy,
  BadgeDollarSign,
  BarChart3,
  ShieldAlert,
  History,
  UserCog,
  Settings,
  Activity,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Sliders,
  Megaphone,
  Flame,
  LayoutTemplate,
  CreditCard,
  RotateCcw,
  KeyRound,
  Bell,
  Terminal,
  Code2,
  Percent,
  Warehouse,
  Heart,
  Zap,
  Globe,
  MessageSquare,
  Server,
  Database,
  Cpu,
  Layers,
  Clock,
  Webhook,
  ListFilter,
  AlertTriangle,
  FileCode2,
  GitBranch,
  Flag,
  Shield,
  Tag,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  permission?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Categories', href: '/admin/categories', icon: Tags },
      { label: 'Brands', href: '/admin/brands', icon: Bookmark },
      { label: 'Category Attributes', href: '/admin/attributes', icon: Sliders },
      { label: 'Tax Profiles', href: '/admin/tax-profiles', icon: Percent },
      { label: 'Return Policies', href: '/admin/return-policies', icon: RotateCcw },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Inventory', href: '/admin/inventory', icon: Boxes },
      { label: 'Warehouses', href: '/admin/warehouses', icon: Warehouse },
    ],
  },
  {
    title: 'Orders',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
      { label: 'Returns', href: '/admin/returns', icon: RotateCcw },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Reviews', href: '/admin/reviews', icon: Star },
      { label: 'Wishlist', href: '/admin/wishlist', icon: Heart },
      { label: 'Support', href: '/admin/support', icon: LifeBuoy },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Coupons', href: '/admin/coupons', icon: BadgePercent },
      { label: 'Offers', href: '/admin/offers', icon: Flame },
      { label: 'Campaigns', href: '/admin/campaigns', icon: Megaphone },
      { label: 'Flash Sales', href: '/admin/flash-sales', icon: Zap },
      { label: 'Abandoned Cart', href: '/admin/abandoned-cart', icon: ShoppingCart },
    ],
  },
  {
    title: 'Store & SEO',
    items: [
      { label: 'Storefront CMS', href: '/admin/content', icon: LayoutTemplate },
      { label: 'SEO Management', href: '/admin/seo', icon: Globe },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Finance Overview', href: '/admin/finance', icon: BadgeDollarSign },
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { label: 'Refunds', href: '/admin/refunds', icon: RotateCcw },
    ],
  },
  {
    title: 'Communication',
    items: [
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Communication Channels', href: '/admin/communication', icon: MessageSquare },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Admin Users', href: '/admin/users', icon: UserCog, permission: 'MANAGE_USERS' },
      { label: 'Roles & Permissions', href: '/admin/roles', icon: KeyRound },
      { label: 'Audit Logs', href: '/admin/audit', icon: History },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'System Health', href: '/admin/health', icon: Activity },
      { label: 'Security', href: '/admin/security', icon: ShieldAlert },
    ],
  },
  {
    title: 'Developer',
    items: [
      { label: 'Developer', href: '/admin/dev', icon: Terminal, permission: 'DEVELOPER_TOOLS' },
    ],
  },
];

export interface DevToolItem {
  id: string;
  label: string;
  icon: React.ElementType;
  category: string;
}

export const DEV_TOOLS: DevToolItem[] = [
  { id: 'overview', label: 'Developer Overview', icon: Terminal, category: 'CORE' },
  { id: 'api-explorer', label: 'API Explorer', icon: Code2, category: 'CORE' },
  { id: 'api-health', label: 'API Health', icon: Activity, category: 'HEALTH' },
  { id: 'system-health', label: 'System Health', icon: Server, category: 'HEALTH' },
  { id: 'database-health', label: 'Database Health', icon: Database, category: 'HEALTH' },
  { id: 'redis-health', label: 'Redis Health', icon: Cpu, category: 'HEALTH' },
  { id: 'queue-health', label: 'Queue Health', icon: Layers, category: 'ASYNC' },
  { id: 'background-jobs', label: 'Background Jobs', icon: Clock, category: 'ASYNC' },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook, category: 'ASYNC' },
  { id: 'event-logs', label: 'Event Logs', icon: ListFilter, category: 'LOGS' },
  { id: 'error-logs', label: 'Error Logs', icon: AlertTriangle, category: 'LOGS' },
  { id: 'request-logs', label: 'Request Logs', icon: FileCode2, category: 'LOGS' },
  { id: 'audit-debugger', label: 'Audit Debugger', icon: History, category: 'LOGS' },
  { id: 'request-trace', label: 'Request Trace', icon: GitBranch, category: 'LOGS' },
  { id: 'cache', label: 'Cache', icon: Zap, category: 'SYSTEM' },
  { id: 'feature-flags', label: 'Feature Flags', icon: Flag, category: 'SYSTEM' },
  { id: 'environment', label: 'Environment', icon: Shield, category: 'SYSTEM' },
  { id: 'integration-status', label: 'Integration Status', icon: Layers, category: 'SYSTEM' },
  { id: 'release-version', label: 'Release / Version', icon: Tag, category: 'SYSTEM' },
  { id: 'security-diagnostics', label: 'Security Diagnostics', icon: Lock, category: 'SECURITY' },
];

export interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function AdminSidebarInner({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();
  const logisticsAppUrl = process.env.NEXT_PUBLIC_LOGISTICS_APP_URL || 'http://localhost:3002';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
        />
      )}

      {/* Primary Sidebar - ONLY SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#0F172A] text-slate-300 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 border-r border-slate-800`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 flex items-center border-b border-slate-800 bg-[#0B1120] transition-all duration-300 ease-in-out ${
            isCollapsed ? 'lg:justify-center lg:px-2 px-6 justify-between' : 'justify-between px-6'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0">
              RG
            </div>
            <div className={`transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <div className="text-sm font-semibold text-white tracking-wide truncate">RGEnterprises</div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-400 truncate">
                Business Admin
              </div>
            </div>
          </div>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ${
                isCollapsed ? 'hidden' : 'flex'
              }`}
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className={`flex-1 overflow-y-auto py-4 space-y-6 ${isCollapsed ? 'lg:px-2 px-3' : 'px-3'}`}>
          {navSections.map((section, idx) => {
            const visibleItems = section.items.filter((item) => {
              if (item.href === '/admin/dev') {
                return (
                  user?.role === 'SUPER_ADMIN' ||
                  user?.role === 'DEVELOPER' ||
                  hasPermission('DEVELOPER_TOOLS')
                );
              }
              return !item.permission || hasPermission(item.permission);
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <div
                  className={`text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${
                    isCollapsed ? 'lg:hidden px-3' : 'px-3'
                  }`}
                >
                  {section.title}
                </div>
                {isCollapsed && <div className="hidden lg:block h-px bg-slate-800/80 my-2 mx-2" />}
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      title={isCollapsed ? item.label : undefined}
                      className={`flex items-center rounded-lg text-xs font-medium transition-all duration-200 ${
                        isCollapsed
                          ? 'lg:justify-center lg:px-2 lg:py-2.5 px-3 py-2 gap-3'
                          : 'gap-3 px-3 py-2'
                      } ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className={`truncate ${isCollapsed ? 'lg:hidden' : 'inline'}`}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}

          {/* Logistics Link */}
          <div className="pt-2 border-t border-slate-800/80">
            <div
              className={`px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 ${
                isCollapsed ? 'lg:hidden' : 'block'
              }`}
            >
              Operations Control
            </div>
            <a
              href={logisticsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={isCollapsed ? 'Logistics Center' : undefined}
              className={`flex items-center rounded-lg text-xs font-medium text-amber-300/90 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/30 transition-all duration-200 ${
                isCollapsed
                  ? 'lg:justify-center lg:px-2 lg:py-2.5 px-3 py-2 justify-between'
                  : 'justify-between px-3 py-2'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-2.5 truncate'}`}>
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className={`truncate ${isCollapsed ? 'lg:hidden' : 'inline ml-2.5'}`}>Logistics Center</span>
              </div>
              <ExternalLink className={`w-3.5 h-3.5 text-amber-400/80 shrink-0 ml-1.5 ${isCollapsed ? 'lg:hidden' : 'inline'}`} />
            </a>
          </div>
        </div>

        {/* User Profile & Session Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#0B1120]">
          <div
            className={`flex items-center rounded-lg ${
              isCollapsed ? 'lg:flex-col lg:gap-2 justify-between' : 'justify-between px-2 py-1.5'
            }`}
          >
            <Link
              href="/admin/profile"
              onClick={onClose}
              title={isCollapsed ? `${user?.name || 'Administrator'} (Profile)` : 'My Profile'}
              className={`flex items-center min-w-0 rounded-lg hover:bg-slate-800/80 transition-colors ${
                isCollapsed ? 'lg:justify-center lg:p-1 gap-2.5 flex-1 px-1 py-0.5' : 'gap-2.5 flex-1 px-1 py-0.5 -mx-1'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-semibold text-white shrink-0 overflow-hidden">
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : user?.name ? (
                  user.name.slice(0, 2).toUpperCase()
                ) : (
                  'AD'
                )}
              </div>
              <div className={`min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                <p className="text-xs font-medium text-white truncate">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.role || 'Staff'}
                </p>
              </div>
            </Link>

            <div className={`flex items-center ${isCollapsed ? 'lg:flex-col lg:gap-1' : 'gap-1'}`}>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-md transition-colors cursor-pointer shrink-0"
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => logout()}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-md transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function AdminSidebar(props: AdminSidebarProps) {
  return (
    <Suspense fallback={<aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] border-r border-slate-800" />}>
      <AdminSidebarInner {...props} />
    </Suspense>
  );
}
