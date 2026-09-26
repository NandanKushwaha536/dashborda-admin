'use client';

import React, { useState, useMemo } from 'react';
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeactivateCoupon,
  useDeleteCoupon,
  Coupon,
} from '@/lib/hooks/useCoupons';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { AdminModal } from '@/components/admin/ui/AdminModal';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import {
  BadgePercent,
  Plus,
  Trash2,
  Edit2,
  Search,
  Power,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CouponFormData {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
}

const INITIAL_FORM: CouponFormData = {
  code: '',
  discountType: 'PERCENTAGE',
  value: 10,
  minOrderAmount: 500,
  status: 'ACTIVE',
};

export default function CouponsPage() {
  const { data: coupons = [], isLoading, error, refetch } = useCoupons();
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deactivateMutation = useDeactivateCoupon();
  const deleteMutation = useDeleteCoupon();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'DISABLED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PERCENTAGE' | 'FIXED'>('ALL');

  // Modal state (Reuses same form for create and edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [couponToDeactivate, setCouponToDeactivate] = useState<Coupon | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!c.code.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== 'ALL' && c.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== 'ALL' && c.discountType !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [coupons, search, statusFilter, typeFilter]);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData(INITIAL_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setFormData({
      code: c.code,
      discountType: c.discountType,
      value: c.value,
      minOrderAmount: c.minOrderAmount,
      status: c.status,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedCode = formData.code.trim().toUpperCase();
    if (!trimmedCode) {
      setFormError('Coupon code is required.');
      return;
    }
    if (formData.value <= 0) {
      setFormError('Discount value must be greater than zero.');
      return;
    }
    if (formData.discountType === 'PERCENTAGE' && formData.value > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }
    if (formData.minOrderAmount < 0) {
      setFormError('Minimum order amount cannot be negative.');
      return;
    }

    try {
      if (editingCoupon) {
        await updateMutation.mutateAsync({
          id: editingCoupon.id,
          data: {
            code: trimmedCode,
            discountType: formData.discountType,
            value: formData.value,
            minOrderAmount: formData.minOrderAmount,
            status: formData.status,
          },
        });
      } else {
        await createMutation.mutateAsync({
          code: trimmedCode,
          discountType: formData.discountType,
          value: formData.value,
          minOrderAmount: formData.minOrderAmount,
          status: formData.status,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save coupon.';
      setFormError(msg);
    }
  };

  const handleToggleStatus = async (c: Coupon) => {
    setActionError(null);
    if (c.status === 'ACTIVE') {
      setCouponToDeactivate(c);
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: c.id,
        data: { status: 'ACTIVE' },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status activation failed';
      setActionError(`Could not activate coupon: ${msg}`);
    }
  };

  const handleDeleteCoupon = (c: Coupon) => {
    setActionError(null);
    setCouponToDelete(c);
  };

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    deactivateMutation.isPending;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Promotions & Coupons"
        description="Configure discount codes, cart threshold criteria, and monitor usage limits."
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
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Coupon
            </AdminButton>
          </div>
        }
      />

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <AdminCard>
        <AdminCardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search Code */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search coupon by code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'EXPIRED' | 'DISABLED')
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="sm:col-span-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'PERCENTAGE' | 'FIXED')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Discount Types</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>
        </AdminCardBody>
      </AdminCard>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <AdminTableSkeleton columns={8} rows={4} />
        ) : error ? (
          <AdminErrorState
            title="Unable to load coupons"
            message="The promotion engine could not retrieve the active coupon catalog."
            onRetry={() => refetch()}
          />
        ) : filteredCoupons.length === 0 ? (
          <AdminCardBody className="py-12">
            <AdminEmptyState
              icon={<BadgePercent className="w-6 h-6" />}
              title="No coupons found"
              description={
                search || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? 'No promotional codes matched your search criteria.'
                  : 'Get started by creating your first promotional discount coupon.'
              }
              actionLabel="Create Coupon"
              onAction={handleOpenCreate}
            />
          </AdminCardBody>
        ) : (
          <AdminTable
            headers={[
              'Code',
              'Type',
              'Discount Value',
              'Min. Order',
              'Usage Count',
              'Expires',
              'Status',
              'Actions',
            ]}
          >
            {filteredCoupons.map((c: Coupon) => (
              <AdminTableRow key={c.id}>
                <AdminTableCell className="font-mono font-bold text-blue-600 text-xs">
                  {c.code}
                </AdminTableCell>

                <AdminTableCell className="text-xs text-slate-600">
                  {c.discountType}
                </AdminTableCell>

                <AdminTableCell className="font-semibold text-slate-900">
                  {c.discountType === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`}
                </AdminTableCell>

                <AdminTableCell className="text-xs text-slate-700">
                  ₹{c.minOrderAmount.toLocaleString()}
                </AdminTableCell>

                <AdminTableCell className="text-xs text-slate-500">
                  {c.usageCount} uses
                </AdminTableCell>

                <AdminTableCell className="text-xs text-slate-500">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                </AdminTableCell>

                <AdminTableCell>
                  <AdminStatusBadge status={c.status} size="sm" />
                </AdminTableCell>

                <AdminTableCell>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                      title="Edit Coupon"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(c)}
                      disabled={isMutating}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        c.status === 'ACTIVE'
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={c.status === 'ACTIVE' ? 'Disable Coupon' : 'Activate Coupon'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(c)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </div>

      {/* CREATE / EDIT COUPON MODAL (Reuses the exact same form) */}
      {isModalOpen && (
        <AdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Promotional Coupon'}
          description="Enforce discount limits across storefront checkout sessions."
          maxWidth="md"
          footer={
            <>
              <AdminButton
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isMutating}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={handleSubmitForm}
                isLoading={isMutating}
              >
                {editingCoupon ? 'Save Changes' : 'Create Coupon'}
              </AdminButton>
            </>
          }
        >
          <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{formError}</div>
              </div>
            )}

            <AdminInput
              label="Coupon Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. FESTIVE20"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <AdminSelect
                label="Discount Type"
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as 'PERCENTAGE' | 'FIXED',
                  })
                }
                options={[
                  { label: 'Percentage (%)', value: 'PERCENTAGE' },
                  { label: 'Fixed Amount (₹)', value: 'FIXED' },
                ]}
              />

              <AdminInput
                label={formData.discountType === 'PERCENTAGE' ? 'Discount Rate (%)' : 'Amount (₹)'}
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <AdminInput
                label="Minimum Order Subtotal (₹)"
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minOrderAmount: Number(e.target.value) })
                }
                required
              />

              <AdminSelect
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'ACTIVE' | 'EXPIRED' | 'DISABLED',
                  })
                }
                options={[
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Disabled', value: 'DISABLED' },
                  { label: 'Expired', value: 'EXPIRED' },
                ]}
              />
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete Coupon Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={Boolean(couponToDelete)}
        onClose={() => setCouponToDelete(null)}
        onConfirm={async () => {
          if (!couponToDelete) return;
          try {
            await deleteMutation.mutateAsync(couponToDelete.id);
            setCouponToDelete(null);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Delete failed';
            setActionError(`Could not delete coupon: ${msg}`);
          }
        }}
        title="Delete Coupon"
        message={`Are you sure you want to delete coupon code "${couponToDelete?.code}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDangerous
        isLoading={deleteMutation.isPending}
      />

      {/* Deactivate Coupon Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={Boolean(couponToDeactivate)}
        onClose={() => setCouponToDeactivate(null)}
        onConfirm={async () => {
          if (!couponToDeactivate) return;
          try {
            await deactivateMutation.mutateAsync(couponToDeactivate.id);
            setCouponToDeactivate(null);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Deactivation failed';
            setActionError(`Could not deactivate coupon: ${msg}`);
          }
        }}
        title="Deactivate Coupon"
        message={`Are you sure you want to deactivate coupon code "${couponToDeactivate?.code}"? Customers will no longer be able to apply this code at checkout.`}
        confirmLabel="Deactivate"
        isDangerous
        isLoading={deactivateMutation.isPending}
      />
    </div>
  );
}
