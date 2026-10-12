'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, MoreHorizontal, UserRound, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { ROLE_LABELS, isAdminRole } from '@/lib/auth/permissions';
import { MOBILE_TABS, NAV_GROUPS, isActivePath, type NavGroup, type NavItem } from '@/lib/navigation';
import { useOrderStatusCounts } from '@/lib/hooks/useOrders';
import { cn } from '@/lib/format';
import { Spinner } from '@/components/ui/Feedback';
import { IconButton } from '@/components/ui/Button';
import { rememberAdminUrl } from '@/components/ui/BackButton';
import { Avatar } from '@/components/ui/Avatar';
import { GlobalSearch } from './GlobalSearch';
import { PERMISSIONS } from '@/lib/auth/permissions';

/** Navigation filtered to what the signed-in role can open. */
function useVisibleNav(): NavGroup[] {
  const { user, can } = useAuth();
  return useMemo(() => {
    const visible = (item: NavItem) => {
      if (item.ownerOnly) return user?.role === 'SUPER_ADMIN';
      if (item.anyOf && !item.anyOf.some((permission) => can(permission))) return false;
      return item.permission ? can(item.permission) : true;
    };
    return NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter(visible) })).filter((group) => group.items.length > 0);
  }, [user, can]);
}

/** Orders waiting for staff action: new, confirmed, picking and packed. */
function useOrdersToAction(enabled: boolean): number {
  const { data } = useOrderStatusCounts(enabled);
  if (!data) return 0;
  return (data.PENDING ?? 0) + (data.CONFIRMED ?? 0) + (data.PROCESSING ?? 0) + (data.PACKED ?? 0);
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 px-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-[13px] font-bold text-white">RG</span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-white">RG Enterprises</span>
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-nav-muted">Admin</span>
      </span>
    </Link>
  );
}

function NavLinks({ groups, pathname, ordersToAction, onNavigate }: {
  groups: NavGroup[];
  pathname: string;
  ordersToAction: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group, index) => (
        <div key={group.title ?? index} className="flex flex-col gap-0.5">
          {group.title ? (
            <span className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-nav-muted">{group.title}</span>
          ) : null}
          {group.items.map((item) => {
            const active = isActivePath(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13.5px] transition-colors',
                  active ? 'bg-nav-active font-semibold text-white' : 'font-medium text-nav-text hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {item.href === '/admin/orders' && ordersToAction > 0 ? (
                  <span className="tabular rounded-full bg-indigo-500 px-2 py-0.5 text-[11px] font-semibold text-white" aria-label={`${ordersToAction} orders need action`}>
                    {ordersToAction}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;
  const roleLabel = isAdminRole(user.role) ? ROLE_LABELS[user.role] : user.role;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-11 items-center gap-2.5 rounded-lg px-1.5 hover:bg-slate-100"
      >
        <Avatar name={user.name} src={user.avatar} size="sm" />
        <span className="hidden flex-col text-left leading-tight sm:flex">
          <span className="text-[13px] font-semibold text-slate-900">{user.name}</span>
          <span className="text-[11.5px] text-slate-500">{roleLabel}</span>
        </span>
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-[12.5px] text-slate-500">{user.email}</p>
          </div>
          <Link
            href="/admin/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm text-slate-700 hover:bg-slate-100"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" /> My profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              await logout();
              router.replace('/login');
            }}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, can } = useAuth();
  const pathname = usePathname() ?? '/admin';
  const router = useRouter();
  const groups = useVisibleNav();
  const ordersToAction = useOrdersToAction(isAuthenticated && can(PERMISSIONS.ORDERS_READ));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
  }, [isLoading, isAuthenticated, pathname, router]);

  useEffect(() => {
    setDrawerOpen(false);
    rememberAdminUrl(window.location.pathname + window.location.search);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const allItems = groups.flatMap((group) => group.items);
  const current = allItems.find((item) => isActivePath(pathname, item));
  const mobileTabs = MOBILE_TABS.map((href) => allItems.find((item) => item.href === href)).filter((item): item is NavItem => Boolean(item));

  return (
    <div className="min-h-screen bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col gap-6 overflow-y-auto bg-nav px-3 py-5 lg:flex" aria-label="Main navigation">
        <Brand />
        <nav aria-label="Main">
          <NavLinks groups={groups} pathname={pathname} ordersToAction={ordersToAction} />
        </nav>
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-label="Menu" className="absolute inset-y-0 left-0 flex w-[86%] max-w-[300px] flex-col gap-6 overflow-y-auto bg-nav px-3 py-4">
            <div className="flex items-center justify-between">
              <Brand />
              <IconButton label="Close menu" tone="dark" onClick={() => setDrawerOpen(false)}>
                <X className="h-5 w-5" aria-hidden="true" />
              </IconButton>
            </div>
            <nav aria-label="Main">
              <NavLinks groups={groups} pathname={pathname} ordersToAction={ordersToAction} onNavigate={() => setDrawerOpen(false)} />
            </nav>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-col lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/95 px-2 backdrop-blur md:h-16 md:px-6">
          <IconButton label="Open menu" className="lg:hidden" onClick={() => setDrawerOpen(true)}>
            <Menu className="h-5 w-5" aria-hidden="true" />
          </IconButton>
          <span className="flex-1 truncate text-[15px] font-semibold text-slate-900 lg:hidden">{current?.label ?? 'Admin'}</span>
          <GlobalSearch />
          <AccountMenu />
        </header>

        <main id="main" className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-5 px-4 pb-28 pt-5 md:gap-6 md:px-6 md:pb-10 md:pt-7">
          {children}
        </main>
      </div>

      <nav aria-label="Quick navigation" className="pb-safe fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white md:hidden">
        {mobileTabs.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11.5px]',
                active ? 'font-semibold text-indigo-700' : 'font-medium text-slate-600'
              )}
            >
              <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
              {item.label === 'Dashboard' ? 'Home' : item.label}
              {item.href === '/admin/orders' && ordersToAction > 0 ? (
                <span className="tabular absolute right-[22%] top-2 rounded-full bg-indigo-600 px-1.5 text-[10.5px] font-semibold text-white">{ordersToAction}</span>
              ) : null}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11.5px] font-medium text-slate-600"
        >
          <MoreHorizontal className="h-[22px] w-[22px]" aria-hidden="true" />
          More
        </button>
      </nav>
    </div>
  );
}
