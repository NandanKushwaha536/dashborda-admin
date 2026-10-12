'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { NAV_GROUPS } from '@/lib/navigation';

const PREVIOUS_KEY = 'admin:previous-url';
const CURRENT_KEY = 'admin:current-url';

/** Called by the shell on every page change so Back can return to the exact list (with its filters). */
export function rememberAdminUrl(url: string): void {
  try {
    const current = sessionStorage.getItem(CURRENT_KEY);
    if (current === url) return;
    if (current) sessionStorage.setItem(PREVIOUS_KEY, current);
    sessionStorage.setItem(CURRENT_KEY, url);
  } catch {
    // Storage blocked: Back still works through the parent link.
  }
}

function parentOf(pathname: string): { href: string; label: string } | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return null;
  const href = `/${segments.slice(0, -1).join('/')}`;
  if (href === '/admin') return { href, label: 'Dashboard' };
  const item = NAV_GROUPS.flatMap((group) => group.items).find((navItem) => navItem.href === href);
  return { href, label: item?.label ?? 'previous page' };
}

/**
 * "Back to …" link shown at the top of every page except the dashboard. It
 * returns to the page the user came from when that is the parent list (so
 * filters are kept), otherwise it opens the parent page.
 */
export function BackButton({ href, label }: { href?: string; label?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const parent = href ? { href, label: label ?? 'previous page' } : parentOf(pathname);
  if (!parent) return null;

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    let previous: string | null = null;
    try {
      previous = sessionStorage.getItem(PREVIOUS_KEY);
    } catch {
      previous = null;
    }
    const previousPath = previous?.split('?')[0];
    if (previousPath === parent.href && window.history.length > 1) router.back();
    else router.push(parent.href);
  };

  return (
    <a
      href={parent.href}
      onClick={onClick}
      className="-ml-1 inline-flex min-h-10 w-fit items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-slate-600 hover:text-indigo-700 focus-visible:text-indigo-700"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to {parent.label}
    </a>
  );
}
