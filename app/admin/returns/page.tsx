'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Check,
  Ban,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  useRefunds,
  useApproveReturn,
  useRejectReturn,
  useProcessReturnRefund,
} from '@/lib/hooks/useFinance';
import { Refund } from '@/lib/api/types';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminPagination } from '@/components/admin/ui/AdminPagination';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminModal } from '@/components/admin/ui/AdminModal';
import { AdminInput } from '@/components/admin/ui/AdminInput';

export default function ReturnsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activeReturn, setActiveReturn] = useState<Refund | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'refund' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);

  const {
    data: returnsData,
    isLoading,
    error,
    refetch,
  } = useRefunds({
    page,
    limit: 15,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const approveMutation = useApproveReturn();
  const rejectMutation = useRejectReturn();
  const processRefundMutation = useProcessReturnRefund();

  const returns = Array.isArray(returnsData?.refunds) ? returnsData.refunds : [];
  const total = returnsData?.total || 0;

  const filteredReturns = returns.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesOrder = r.orderNumber?.toLowerCase().includes(q);
      const matchesCustomer = r.customerName?.toLowerCase().includes(q);
      const matchesReason = r.reason?.toLowerCase().includes(q);
      if (!matchesOrder && !matchesCustomer && !matchesReason) return false;
    }
    return true;
  });

  const handleOpenApprove = (r: Refund) => {
    setActiveReturn(r);
    setActionType('approve');
    setActionReason('');
  };

  const handleOpenReject = (r: Refund) => {
    setActiveReturn(r);
    setActionType('reject');
    setActionReason('');
  };

  const handleOpenRefund = (r: Refund) => {
    setActiveReturn(r);
    setActionType('refund');
    setRefundAmount(r.amount);
    setActionReason('');
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReturn) return;

    if (actionType === 'approve') {
      await approveMutation.mutateAsync(activeReturn.id);
    } else if (actionType === 'reject') {
      await rejectMutation.mutateAsync({
        id: activeReturn.id,
        reason: actionReason,
      });
    } else if (actionType === 'refund') {
      await processRefundMutation.mutateAsync({
        id: activeReturn.id,
        amount: refundAmount,
        notes: actionReason,
      });
    }

    setActionType(null);
    setActiveReturn(null);
    refetch();
  };

  const isPending =
    approveMutation.isPending || rejectMutation.isPending || processRefundMutation.isPending;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Returns & RMA Management"
        description="Verify returned parcels, inspect return reasons, approve replacements, and initiate refund settlements."
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
            <Link href="/admin/orders">
              <AdminButton variant="primary" size="sm">
                Orders Registry
              </AdminButton>
            </Link>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order #, customer, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            {['all', 'REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {total} Return Request{total === 1 ? '' : 's'} Total
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <AdminTableSkeleton rows={5} columns={6} />
        ) : filteredReturns.length === 0 ? (
          <div className="py-12">
            <AdminEmptyState
              icon={<RotateCcw className="w-6 h-6" />}
              title="No customer return requests found"
              description="When customers request return, replacement, or refund on eligible orders, they appear in this RMA queue."
            />
          </div>
        ) : (
          <AdminTable
            headers={[
              'Order #',
              'Customer',
              'Requested Amount',
              'Return Reason',
              'Status',
              'Requested Date',
              'Actions',
            ]}
          >
            {filteredReturns.map((item) => (
              <AdminTableRow key={item.id}>
                <AdminTableCell>
                  <Link
                    href={`/admin/orders/${item.orderId || item.orderNumber}`}
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>{item.orderNumber}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="font-medium text-slate-800">{item.customerName || 'Verified Customer'}</span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="font-bold text-slate-900">
                    ₹{(item.amount || 0).toLocaleString()}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-xs text-slate-600 max-w-xs truncate block" title={item.reason}>
                    {item.reason || 'Customer requested return'}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <AdminStatusBadge status={item.status} />
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-xs text-slate-500">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <div className="flex items-center gap-1.5">
                    {item.status === 'REQUESTED' && (
                      <>
                        <AdminButton
                          size="xs"
                          variant="primary"
                          onClick={() => handleOpenApprove(item)}
                          leftIcon={<Check className="w-3 h-3" />}
                        >
                          Approve
                        </AdminButton>
                        <AdminButton
                          size="xs"
                          variant="outline"
                          onClick={() => handleOpenReject(item)}
                          leftIcon={<Ban className="w-3 h-3" />}
                        >
                          Reject
                        </AdminButton>
                      </>
                    )}
                    {item.status === 'APPROVED' && (
                      <AdminButton
                        size="xs"
                        variant="primary"
                        onClick={() => handleOpenRefund(item)}
                        leftIcon={<RotateCcw className="w-3 h-3" />}
                      >
                        Settle Refund
                      </AdminButton>
                    )}
                    {item.status === 'PROCESSED' && (
                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Settled
                      </span>
                    )}
                    {item.status === 'REJECTED' && (
                      <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}

        <AdminPagination
          currentPage={page}
          totalItems={total}
          pageSize={15}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Confirmation & Action Modal */}
      <AdminModal
        isOpen={Boolean(actionType && activeReturn)}
        onClose={() => setActionType(null)}
        title={
          actionType === 'approve'
            ? 'Approve Return Request'
            : actionType === 'reject'
            ? 'Reject Return Request'
            : 'Settle & Process Customer Refund'
        }
        description={`Target Order: ${activeReturn?.orderNumber} • Amount: ₹${activeReturn?.amount.toLocaleString()}`}
      >
        <form onSubmit={handleConfirmAction} className="space-y-4">
          {actionType === 'approve' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-3 rounded-lg space-y-2">
              <p className="font-bold">Approve Return RMA</p>
              <p>
                Approving this request authorizes the buyer to send the parcel back. You can inspect
                the returned goods before releasing the refund payment.
              </p>
            </div>
          )}

          {actionType === 'reject' && (
            <div className="space-y-3">
              <div className="bg-rose-50 border border-rose-200 text-rose-900 text-xs p-3 rounded-lg">
                Please provide the business justification for rejecting this return request. This
                will be stored in the order audit log.
              </div>
              <AdminInput
                label="Rejection Reason"
                placeholder="e.g. Return window expired, item damaged by customer, physical seal broken"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                required
              />
            </div>
          )}

          {actionType === 'refund' && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3 rounded-lg">
                Initiating this refund will credit the buyer through the original payment gateway.
              </div>
              <AdminInput
                label="Refund Amount (₹)"
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                required
              />
              <AdminInput
                label="Settlement Notes"
                placeholder="Optional notes or gateway transaction reference"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <AdminButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActionType(null)}
            >
              Cancel
            </AdminButton>
            <AdminButton
              type="submit"
              variant={actionType === 'reject' ? 'danger' : 'primary'}
              size="sm"
              disabled={isPending}
            >
              {isPending
                ? 'Processing...'
                : actionType === 'approve'
                ? 'Confirm Approval'
                : actionType === 'reject'
                ? 'Confirm Rejection'
                : 'Process Refund'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
