'use client';

import React, { useState } from 'react';
import { useInventoryOverview } from '@/lib/hooks/useInventory';
import { InventoryItem } from '@/lib/api/types';
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
import { StockAdjustmentModal } from '@/components/admin/inventory/StockAdjustmentModal';
import { Boxes, SlidersHorizontal, RotateCcw } from 'lucide-react';

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useInventoryOverview({
    page,
    limit: 15,
    search,
    status: statusFilter,
  });

  const items = Array.isArray(data?.items) ? data.items : [];
  const total = data?.total || 0;

  const hasActiveFilters = Boolean(search || statusFilter);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Inventory Operations"
        description="Monitor physical on-hand stock, reserved order allocations, and execute audited adjustments."
        actions={
          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Refresh
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              onClick={() => setIsManualModalOpen(true)}
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            >
              Adjust Stock Level
            </AdminButton>
          </div>
        }
      />

      <AdminFilterBar
        hasActiveFilters={hasActiveFilters}
        onReset={() => {
          setSearch('');
          setStatusFilter('');
          setPage(1);
        }}
      >
        <AdminSearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by SKU or item name..."
          className="w-full sm:w-72"
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Inventory Statuses</option>
          <option value="IN_STOCK">IN STOCK</option>
          <option value="LOW_STOCK">LOW STOCK</option>
          <option value="OUT_OF_STOCK">OUT OF STOCK</option>
        </select>
      </AdminFilterBar>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <AdminTableSkeleton rows={8} columns={7} />
        ) : error ? (
          <div className="py-12">
            <AdminErrorState
              title="Failed to load inventory records"
              message="Could not reach the inventory backend endpoint."
              onRetry={() => refetch()}
            />
          </div>
        ) : items.length === 0 ? (
          <AdminEmptyState
            icon={<Boxes className="w-8 h-8" />}
            title="No inventory records found"
            description={
              hasActiveFilters
                ? 'No items matched your inventory filters.'
                : 'Zero inventory records tracked in database.'
            }
          />
        ) : (
          <>
            <AdminTable
              headers={[
                'SKU Identifier',
                'Product Name',
                'Total Stock',
                'Reserved',
                'Available',
                'Reorder Point',
                'Inventory State',
                'Actions',
              ]}
            >
              {items.map((item) => (
                <AdminTableRow key={item._id}>
                  <AdminTableCell className="font-semibold text-slate-900 text-xs font-mono">
                    {item.sku}
                  </AdminTableCell>

                  <AdminTableCell>
                    <div className="font-medium text-slate-900">{item.productName}</div>
                    {item.warehouse && (
                      <span className="text-[11px] text-slate-400">Warehouse: {item.warehouse}</span>
                    )}
                  </AdminTableCell>

                  <AdminTableCell className="font-semibold text-slate-800">
                    {item.totalStock}
                  </AdminTableCell>

                  <AdminTableCell className="text-xs text-amber-700 font-medium">
                    {typeof item.reserved === 'number' ? `${item.reserved} units` : '—'}
                  </AdminTableCell>

                  <AdminTableCell>
                    <span
                      className={`font-bold text-xs ${
                        typeof item.reorderPoint === 'number' && item.available <= item.reorderPoint
                          ? 'text-red-600'
                          : 'text-teal-700'
                      }`}
                    >
                      {item.available}
                    </span>
                  </AdminTableCell>

                  <AdminTableCell className="text-xs text-slate-500">
                    {typeof item.reorderPoint === 'number' ? `${item.reorderPoint} units` : '—'}
                  </AdminTableCell>

                  <AdminTableCell>
                    <AdminStatusBadge status={item.status} size="sm" />
                  </AdminTableCell>

                  <AdminTableCell>
                    <AdminButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setAdjustingItem(item)}
                      leftIcon={<SlidersHorizontal className="w-3 h-3" />}
                    >
                      Adjust
                    </AdminButton>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>

            <AdminPagination
              currentPage={page}
              totalItems={total}
              pageSize={15}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      {/* Adjustment Modal */}
      {(isManualModalOpen || adjustingItem) && (
        <StockAdjustmentModal
          isOpen={isManualModalOpen || Boolean(adjustingItem)}
          onClose={() => {
            setIsManualModalOpen(false);
            setAdjustingItem(null);
          }}
          item={adjustingItem}
        />
      )}
    </div>
  );
}
