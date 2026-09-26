'use client';

import React from 'react';
import { Menu, ExternalLink, Bell, PanelLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { GlobalSearch } from './GlobalSearch';

export function AdminHeader({
  onMenuClick,
  isCollapsed,
  onToggleCollapse,
}: {
  onMenuClick: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const { user } = useAuth();
  const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000';

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-2xs gap-2">
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="hidden xl:flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            Live ERP
          </span>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs text-slate-500 font-medium">Authoritative Backend Sync</span>
        </div>
      </div>

      {/* Center: Global Search Component across Products, Orders, Customers */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-1 sm:mx-4">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Storefront preview link */}
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <span>Storefront</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>

        {/* Notifications Icon */}
        <button
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="System Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Authenticated user indicator */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold flex items-center justify-center border border-blue-200">
            {user?.name ? user.name.slice(0, 1).toUpperCase() : 'A'}
          </div>
          <span className="hidden sm:inline-block text-xs font-medium text-slate-700">
            {user?.name || 'Administrator'}
          </span>
        </div>
      </div>
    </header>
  );
}
