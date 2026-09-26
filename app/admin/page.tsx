'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BadgeDollarSign,
  ShoppingCart,
  Users,
  Clock,
  ArrowRight,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Calendar,
  RotateCcw,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import {
  useDetailedDashboardMetrics,
  useDashboardSales,
  useDashboardActivity,
} from '@/lib/hooks/useDashboard';
import { useInventoryOverview } from '@/lib/hooks/useInventory';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/ui/AdminStatCard';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';

type DateFilter = 'today' | 'yesterday' | '7d' | '30d' | 'custom';

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useDetailedDashboardMetrics();

  const customDates =
    dateFilter === 'custom' && customStart && customEnd
      ? { start: customStart, end: customEnd }
      : undefined;

  const { data: sales = [], isLoading: salesLoading } = useDashboardSales(dateFilter, customDates);
  const { data: activities = [] } = useDashboardActivity();
  const { data: lowStockData } = useInventoryOverview({ status: 'LOW_STOCK', limit: 5 });

  const lowStockItems = lowStockData?.items || [];

  if (metricsError) {
    return (
      <div className="py-12">
        <AdminErrorState
          title="Failed to load dashboard metrics"
          message="Could not retrieve real-time commercial statistics from the backend server."
          onRetry={() => refetchMetrics()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Commerce Control Dashboard"
        description="Real-time commercial metrics, inventory health, order lifecycle, and revenue telemetry."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Filters: Today, Yesterday, Last 7 Days, Last 30 Days, Custom Range */}
            <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  dateFilter === 'today'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('yesterday')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  dateFilter === 'yesterday'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('7d')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  dateFilter === '7d'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('30d')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  dateFilter === '30d'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('custom')}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  dateFilter === 'custom'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom Range
              </button>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="outline-none text-slate-700 text-xs"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="outline-none text-slate-700 text-xs"
                />
              </div>
            )}

            <Link href="/admin/orders">
              <AdminButton size="sm" variant="outline">
                Orders
              </AdminButton>
            </Link>
            <Link href="/admin/products">
              <AdminButton size="sm" variant="primary">
                Products
              </AdminButton>
            </Link>
          </div>
        }
      />

      {/* Pending Actions Alert Banner if any actionable issues exist */}
      {metrics && metrics.pendingActions > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {metrics.pendingActions} Pending Business Actions Required
              </p>
              <p className="text-[11px] text-amber-700">
                {metrics.pendingOrders} order(s) awaiting confirmation • {metrics.lowStockCount} inventory SKU(s) near exhaustion.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/orders?status=PENDING">
              <AdminButton size="xs" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100">
                Review Orders
              </AdminButton>
            </Link>
            <Link href="/admin/inventory">
              <AdminButton size="xs" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100">
                Check Stock
              </AdminButton>
            </Link>
          </div>
        </div>
      )}

      {/* Section 1: Executive KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <AdminSkeleton className="h-4 w-1/2" />
              <AdminSkeleton className="h-8 w-2/3" />
            </div>
          ))
        ) : (
          <>
            <AdminStatCard
              title="Sales / Total Revenue"
              value={metrics ? `₹${metrics.totalRevenue.toLocaleString()}` : '—'}
              subtitle={metrics?.periodRevenue ? `₹${metrics.periodRevenue.toLocaleString()} in selected period` : 'All verified orders'}
              icon={<BadgeDollarSign className="w-5 h-5 text-blue-600" />}
            />
            <AdminStatCard
              title="Total Orders"
              value={metrics ? metrics.totalOrders.toLocaleString() : '—'}
              subtitle={`${metrics?.todayOrders ?? 0} placed today`}
              icon={<ShoppingCart className="w-5 h-5 text-teal-600" />}
            />
            <AdminStatCard
              title="Total Customers"
              value={metrics ? metrics.totalCustomers.toLocaleString() : '—'}
              subtitle={`${metrics?.newCustomers ?? 0} new accounts recorded`}
              icon={<Users className="w-5 h-5 text-indigo-600" />}
            />
            <AdminStatCard
              title="Pending Actions"
              value={metrics ? metrics.pendingActions.toLocaleString() : '—'}
              subtitle={`${metrics?.pendingOrders ?? 0} pending orders`}
              icon={<Clock className="w-5 h-5 text-amber-600" />}
            />
          </>
        )}
      </div>

      {/* Section 2: Order Lifecycle & Catalog Health Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orders Breakdown */}
        <AdminCard className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Order Breakdown</span>
            <Link href="/admin/orders" className="text-[11px] text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> Pending</span>
              <span className="font-bold text-slate-900">{metrics?.pendingOrders ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Confirmed</span>
              <span className="font-bold text-slate-900">{metrics?.confirmedOrders ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Delivered</span>
              <span className="font-bold text-slate-900">{metrics?.deliveredOrders ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-rose-500" /> Cancelled</span>
              <span className="font-bold text-slate-900">{metrics?.cancelledOrders ?? 0}</span>
            </div>
          </div>
        </AdminCard>

        {/* Catalog Stock Breakdown */}
        <AdminCard className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Catalog & Stock</span>
            <Link href="/admin/products" className="text-[11px] text-blue-600 hover:underline">Manage</Link>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-blue-500" /> Total Products</span>
              <span className="font-bold text-slate-900">{metrics?.totalProducts ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active Products</span>
              <span className="font-bold text-slate-900">{metrics?.activeProducts ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Low Stock</span>
              <span className="font-bold text-amber-600">{metrics?.lowStockCount ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-rose-500" /> Out of Stock</span>
              <span className="font-bold text-rose-600">{metrics?.outOfStockCount ?? 0}</span>
            </div>
          </div>
        </AdminCard>

        {/* Customer Accounts */}
        <AdminCard className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Customers</span>
            <Link href="/admin/customers" className="text-[11px] text-blue-600 hover:underline">Accounts</Link>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-indigo-500" /> Total Accounts</span>
              <span className="font-bold text-slate-900">{metrics?.totalCustomers ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> Active Users</span>
              <span className="font-bold text-slate-900">{metrics?.activeCustomers ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> New Signups</span>
              <span className="font-bold text-slate-900">{metrics?.newCustomers ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> Today&apos;s Orders</span>
              <span className="font-bold text-slate-900">{metrics?.todayOrders ?? 0}</span>
            </div>
          </div>
        </AdminCard>

        {/* Finance & Payments */}
        <AdminCard className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Finance & Ledger</span>
            <Link href="/admin/finance" className="text-[11px] text-blue-600 hover:underline">Ledger</Link>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><BadgeDollarSign className="w-3.5 h-3.5 text-emerald-500" /> Gross Sales</span>
              <span className="font-bold text-slate-900">₹{(metrics?.totalRevenue ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Refunds Settled</span>
              <span className="font-bold text-amber-700">₹{(metrics?.refundsTotal ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Payment Tx</span>
              <span className="font-bold text-slate-900">{metrics?.paymentsCount ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Out of Stock</span>
              <span className="font-bold text-rose-700">{metrics?.outOfStockCount ?? 0}</span>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Main Grid: Sales Performance Chart & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Summary */}
        <div className="lg:col-span-2">
          <AdminCard className="h-full flex flex-col">
            <AdminCardHeader
              title="Commercial Revenue & Order Trends"
              subtitle={`Telemetry based on ${dateFilter.toUpperCase()} backend sales records`}
              action={
                <Link
                  href="/admin/finance"
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Finance Reports</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <AdminCardBody className="flex-1">
              {salesLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <AdminSkeleton className="h-40 w-full" />
                </div>
              ) : sales.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center text-slate-400">
                  <Boxes className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs font-medium">No sales transaction records returned for this period.</p>
                  <p className="text-[11px] text-slate-400 mt-1">New order completions will populate this ledger chart dynamically.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Period Volume</span>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">
                        {sales.reduce((acc, s) => acc + s.orders, 0)} orders
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Period Revenue</span>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">
                        ₹{sales.reduce((acc, s) => acc + s.revenue, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Average Order Value</span>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">
                        ₹
                        {sales.reduce((acc, s) => acc + s.orders, 0) > 0
                          ? Math.round(
                              sales.reduce((acc, s) => acc + s.revenue, 0) /
                                sales.reduce((acc, s) => acc + s.orders, 0)
                            ).toLocaleString()
                          : '0'}
                      </p>
                    </div>
                  </div>

                  {/* Summary bars */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold text-slate-700">Recent Days Recorded</div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {sales.slice(-5).reverse().map((entry, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between">
                          <span className="text-slate-600 font-medium">{entry.date}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-500">{entry.orders} orders</span>
                            <span className="font-bold text-slate-900">₹{entry.revenue.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </AdminCardBody>
          </AdminCard>
        </div>

        {/* Live System Activity */}
        <div>
          <AdminCard className="h-full flex flex-col">
            <AdminCardHeader
              title="Recent Activity"
              subtitle="Real-time backend audit event stream"
              action={
                <Link
                  href="/admin/audit"
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  Audit Trail
                </Link>
              }
            />
            <AdminCardBody className="flex-1 p-0">
              {activities.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No recent audit events recorded.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activities.map((act) => (
                    <div key={act.id} className="p-3.5 space-y-1 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{act.type}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{act.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </AdminCardBody>
          </AdminCard>
        </div>
      </div>

      {/* Low Stock Warnings */}
      {lowStockItems.length > 0 && (
        <AdminCard>
          <AdminCardHeader
            title={
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Low Inventory Stock Warnings</span>
              </div>
            }
            subtitle="Products that have reached reorder thresholds"
            action={
              <Link href="/admin/inventory">
                <AdminButton size="sm" variant="outline">
                  Manage Inventory
                </AdminButton>
              </Link>
            }
          />
          <div className="divide-y divide-slate-100 text-xs">
            {lowStockItems.map((item) => (
              <div key={item._id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{item.productName}</p>
                  <p className="text-slate-400 text-[11px]">SKU: {item.sku}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-bold text-amber-700">{item.available}</span>
                    <span className="text-slate-400"> units available</span>
                  </div>
                  <AdminStatusBadge status={item.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </div>
  );
}
