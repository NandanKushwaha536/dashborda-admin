'use client';

import React, { useState, useMemo } from 'react';
import { useOrders } from '@/lib/hooks/useOrders';
import { Order } from '@/lib/api/types';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminSearchBar } from '@/components/admin/ui/AdminSearchBar';
import { AdminFilterBar } from '@/components/admin/ui/AdminFilterBar';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminPagination } from '@/components/admin/ui/AdminPagination';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { OrderDetailDrawer } from '@/components/admin/orders/OrderDetailDrawer';
import {
  ShoppingCart,
  Eye,
  RotateCcw,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrderTotal, setSortOrderTotal] = useState<'none' | 'asc' | 'desc'>('none');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading, error, refetch } = useOrders({
    page,
    limit: 15,
    search,
    status: statusFilter,
    paymentStatus: paymentFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy: sortOrderTotal !== 'none' ? 'totalAmount' : undefined,
    sortOrder: sortOrderTotal !== 'none' ? sortOrderTotal : undefined,
  });

  const rawOrders = data?.orders;
  const total = data?.total || 0;

  // Toggle sorting by Order Total
  const handleToggleSortTotal = () => {
    setSortOrderTotal((prev) => {
      if (prev === 'none') return 'desc';
      if (prev === 'desc') return 'asc';
      return 'none';
    });
  };

  // Dynamic client-side date range filtering by placedAt timestamp and sorting
  const filteredOrders = useMemo(() => {
    let list = Array.isArray(rawOrders) ? [...rawOrders] : [];

    // Filter by placement timestamp (placedAt)
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const startTime = start.getTime();
      list = list.filter((order) => {
        if (!order.placedAt) return false;
        const placedTime = new Date(order.placedAt).getTime();
        return !isNaN(placedTime) && placedTime >= startTime;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const endTime = end.getTime();
      list = list.filter((order) => {
        if (!order.placedAt) return false;
        const placedTime = new Date(order.placedAt).getTime();
        return !isNaN(placedTime) && placedTime <= endTime;
      });
    }

    // Dynamic Sorting by Order Total (totalAmount)
    if (sortOrderTotal === 'asc') {
      list.sort((a, b) => Number(a.totalAmount ?? 0) - Number(b.totalAmount ?? 0));
    } else if (sortOrderTotal === 'desc') {
      list.sort((a, b) => Number(b.totalAmount ?? 0) - Number(a.totalAmount ?? 0));
    }

    return list;
  }, [rawOrders, startDate, endDate, sortOrderTotal]);

  const hasActiveFilters = Boolean(
    search || statusFilter || paymentFilter || startDate || endDate || sortOrderTotal !== 'none'
  );

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPaymentFilter('');
    setStartDate('');
    setEndDate('');
    setSortOrderTotal('none');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Commercial Orders"
        description="Monitor order placement, payment reconciliation, and fulfillment transitions."
        actions={
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Refresh
          </AdminButton>
        }
      />

      {/* Primary Search & Status Filters */}
      <AdminFilterBar
        hasActiveFilters={hasActiveFilters}
        onReset={handleResetFilters}
      >
        <AdminSearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by order #, customer, or phone..."
          className="w-full sm:w-64"
        />

        {/* Order Status Select */}
        <select
          id="filter-order-status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">All Order Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="PACKED">PACKED</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="RETURNED">RETURNED</option>
          <option value="NDR">NDR (Exception)</option>
          <option value="RTO">RTO (Return to Origin)</option>
        </select>

        {/* Payment Status Select */}
        <select
          id="filter-payment-status"
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">All Payment Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="FAILED">FAILED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>

        {/* Dual Date Range Picker (From/To) in AdminFilterBar filtering by placedAt */}
        <div id="order-dual-date-range-picker" className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs hover:border-slate-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0 select-none" />

            {/* From Date */}
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="order-date-from"
                className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider select-none cursor-pointer"
              >
                From:
              </label>
              <input
                id="order-date-from"
                name="orderDateFrom"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                aria-label="From Date"
                title="Filter orders placed on or after this date"
                className="bg-transparent text-xs text-slate-900 font-medium outline-hidden cursor-pointer focus:outline-none"
              />
            </div>

            <span className="text-slate-300 font-light select-none">→</span>

            {/* To Date */}
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="order-date-to"
                className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider select-none cursor-pointer"
              >
                To:
              </label>
              <input
                id="order-date-to"
                name="orderDateTo"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                aria-label="To Date"
                title="Filter orders placed on or before this date"
                className="bg-transparent text-xs text-slate-900 font-medium outline-hidden cursor-pointer focus:outline-none"
              />
            </div>

            {(startDate || endDate) && (
              <button
                id="clear-order-date-range"
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                title="Clear date range"
                aria-label="Clear date range"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1">
            {[
              { id: 'today', label: 'Today', days: 0 },
              { id: '7d', label: '7D', days: 7 },
              { id: '30d', label: '30D', days: 30 },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  const now = new Date();
                  const past = new Date();
                  past.setDate(past.getDate() - preset.days);
                  const toStr = (d: Date) => d.toISOString().split('T')[0];
                  setStartDate(toStr(past));
                  setEndDate(toStr(now));
                  setPage(1);
                }}
                className="px-2 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer select-none"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Sort Selector */}
        <select
          id="sort-orders-selector"
          value={sortOrderTotal}
          onChange={(e) => setSortOrderTotal(e.target.value as 'none' | 'asc' | 'desc')}
          className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
          aria-label="Sort by total"
        >
          <option value="none">Sort: Default (Date)</option>
          <option value="desc">Sort: Order Total (High to Low)</option>
          <option value="asc">Sort: Order Total (Low to High)</option>
        </select>
      </AdminFilterBar>

      {/* Active Date Range Indicator */}
      {(startDate || endDate) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50/75 border border-blue-200 rounded-lg text-xs text-blue-900 shadow-2xs">
          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Filtering orders by placement timestamp (<strong>placedAt</strong>):{' '}
            <strong className="text-blue-950 font-semibold">
              {startDate ? new Date(startDate).toLocaleDateString() : 'Earliest record'}
            </strong>{' '}
            to{' '}
            <strong className="text-blue-950 font-semibold">
              {endDate ? new Date(endDate).toLocaleDateString() : 'Latest record'}
            </strong>
          </span>
          <span className="text-blue-700 font-semibold ml-auto bg-blue-100 px-2 py-0.5 rounded text-[11px]">
            {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'} matching
          </span>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <AdminTableSkeleton rows={8} columns={7} />
        ) : error ? (
          <div className="py-12">
            <AdminErrorState
              title="Failed to load orders"
              message="Could not communicate with the orders endpoint on the backend."
              onRetry={() => refetch()}
            />
          </div>
        ) : filteredOrders.length === 0 ? (
          <AdminEmptyState
            icon={<ShoppingCart className="w-8 h-8" />}
            title="No orders found"
            description={
              hasActiveFilters
                ? 'No orders matched your current search filters or placement date range. Try adjusting your criteria.'
                : 'Zero orders recorded in the backend system yet.'
            }
            actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
            onAction={hasActiveFilters ? handleResetFilters : undefined}
          />
        ) : (
          <>
            <AdminTable
              headers={[
                'Order #',
                'Customer',
                'Placement Date & Time',
                'Items',
                (
                  <button
                    key="sort-order-total"
                    type="button"
                    onClick={handleToggleSortTotal}
                    className="inline-flex items-center gap-1.5 uppercase font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer group select-none"
                    title="Click to sort by Order Total (High to Low / Low to High)"
                  >
                    <span>Order Total</span>
                    {sortOrderTotal === 'desc' ? (
                      <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : sortOrderTotal === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                    )}
                  </button>
                ),
                'Payment',
                'Fulfillment State',
                'Logistics Info',
                'Actions',
              ]}
            >
              {filteredOrders.map((order) => (
                <AdminTableRow
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                >
                  <AdminTableCell className="font-semibold text-blue-600">
                    #{order.orderNumber}
                  </AdminTableCell>

                  <AdminTableCell>
                    <div className="font-medium text-slate-900">{order.customer?.name || 'Guest Customer'}</div>
                    <div className="text-xs text-slate-400">{order.customer?.phone || '—'}</div>
                  </AdminTableCell>

                  <AdminTableCell className="text-xs whitespace-nowrap">
                    <div className="font-medium text-slate-800">
                      {new Date(order.placedAt).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(order.placedAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </AdminTableCell>

                  <AdminTableCell className="text-xs text-slate-600">
                    {order.items.length} items
                  </AdminTableCell>

                  <AdminTableCell className="font-bold text-slate-900">
                    ₹{Number(order.totalAmount ?? 0).toLocaleString()}
                  </AdminTableCell>

                  <AdminTableCell>
                    <AdminStatusBadge status={order.paymentStatus} size="sm" />
                  </AdminTableCell>

                  <AdminTableCell>
                    <AdminStatusBadge status={order.status} size="sm" />
                  </AdminTableCell>

                  <AdminTableCell className="text-xs">
                    {order.trackingNumber ? (
                      <div className="space-y-0.5">
                        <span className="font-medium text-slate-800">{order.courier || 'Carrier'}</span>
                        <div className="text-[11px] text-slate-400">AWB: {order.trackingNumber}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                    )}
                  </AdminTableCell>

                  <AdminTableCell>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>

            <AdminPagination
              currentPage={page}
              totalItems={total}
              pageSize={15}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </>
        )}
      </div>

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
