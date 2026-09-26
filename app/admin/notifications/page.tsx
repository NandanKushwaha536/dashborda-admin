'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Check,
  Filter,
  ShoppingCart,
  AlertTriangle,
  CreditCard,
  RotateCcw,
  ShieldAlert,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/lib/hooks/useGovernance';
import { AdminNotification } from '@/lib/api/types';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard } from '@/components/admin/ui/AdminCard';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';

const TYPE_ICONS: Record<AdminNotification['type'], React.ElementType> = {
  ORDER: ShoppingCart,
  INVENTORY: AlertTriangle,
  STOCK: AlertTriangle,
  PAYMENT: CreditCard,
  REFUND: RotateCcw,
  SECURITY: ShieldAlert,
  CUSTOMER: Users,
  SYSTEM: Bell,
  INFO: Bell,
  WARNING: AlertTriangle,
  ALERT: ShieldAlert,
  FINANCE: CreditCard,
};

const TYPE_COLORS: Record<AdminNotification['type'], { bg: string; text: string; border: string }> = {
  ORDER: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  INVENTORY: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  STOCK: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PAYMENT: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  REFUND: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  SECURITY: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  CUSTOMER: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  SYSTEM: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  INFO: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  WARNING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ALERT: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  FINANCE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

export default function NotificationsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data: notifications = [], isLoading, error, refetch } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (readFilter === 'unread' && n.isRead) return false;
    if (readFilter === 'read' && !n.isRead) return false;
    return true;
  });

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    markReadMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notifications & Operations Alert Center"
        description="Real-time event stream for high-value orders, inventory stockouts, payment gateway errors, and refunds."
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <AdminButton
                variant="outline"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                isLoading={markAllReadMutation.isPending}
                leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
              >
                Mark All as Read
              </AdminButton>
            )}
            <AdminButton variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </AdminButton>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Read status toggles */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setReadFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                readFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setReadFilter('unread')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                readFilter === 'unread' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setReadFilter('read')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                readFilter === 'read' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="all">All Notification Types</option>
            <option value="ORDER">Orders</option>
            <option value="INVENTORY">Inventory & Stock</option>
            <option value="PAYMENT">Payments</option>
            <option value="REFUND">Refunds & Returns</option>
            <option value="SECURITY">Security & Logins</option>
            <option value="CUSTOMER">Customers</option>
            <option value="SYSTEM">System Alerts</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900">{filteredNotifications.length}</span> alerts
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <AdminSkeleton className="h-4 w-1/4" />
              <AdminSkeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <AdminErrorState
          title="Failed to load notifications"
          message="Could not connect to the real-time notification service."
          onRetry={() => refetch()}
        />
      ) : filteredNotifications.length === 0 ? (
        <AdminEmptyState
          icon={<Bell className="w-6 h-6" />}
          title="No notifications to display"
          description="Operational alerts will trigger automatically when relevant store events occur."
        />
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((notif) => {
            const Icon = TYPE_ICONS[notif.type] || Bell;
            const colors = TYPE_COLORS[notif.type] || TYPE_COLORS.SYSTEM;

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  notif.isRead
                    ? 'bg-white border-slate-200 hover:bg-slate-50/50'
                    : 'bg-blue-50/40 border-blue-200 hover:bg-blue-50/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors.bg} ${colors.text} border ${colors.border}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{notif.title}</span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${colors.bg} ${colors.text}`}
                      >
                        {notif.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{notif.message}</p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(notif.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {notif.actionUrl && (
                    <Link href={notif.actionUrl}>
                      <AdminButton
                        size="xs"
                        variant="outline"
                        rightIcon={<ArrowRight className="w-3 h-3" />}
                        onClick={() => {
                          if (!notif.isRead) handleMarkAsRead(notif.id);
                        }}
                      >
                        View Record
                      </AdminButton>
                    </Link>
                  )}

                  {!notif.isRead && (
                    <AdminButton
                      size="xs"
                      variant="ghost"
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      leftIcon={<Check className="w-3 h-3" />}
                    >
                      Mark Read
                    </AdminButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
