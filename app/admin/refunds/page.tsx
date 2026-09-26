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
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { AdminModal } from '@/components/admin/ui/AdminModal';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { PermissionGate } from '@/components/admin/auth/PermissionGate';

export default function RefundsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activeRefund, setActiveRefund] = useState<Refund | null>(null);
  const [actionType, setActionType] = useState<'refund' | 'reject' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);

  const {
    data: refundsData,
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

  const refunds = Array.isArray(refundsData?.refunds) ? refundsData.refunds : [];
  const total = refundsData?.total || 0;

  const filteredRefunds = refunds.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesOrder = r.orderNumber?.toLowerCase().includes(q);
      const matchesCustomer = r.customerName?.toLowerCase().includes(q);
      const matchesReason = r.reason?.toLowerCase().includes(q);
      if (!matchesOrder && !matchesCustomer && !matchesReason) return false;
    }
    return true;
  });

  const handleOpenProcessRefund = (r: Refund) => {
    setActiveRefund(r);
    setActionType('refund');
    setRefundAmount(r.amount);
    setActionReason('');
  };

  const handleOpenReject = (r: Refund) => {
    setActiveRefund(r);
    setActionType('reject');
    setActionReason('');
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRefund) return;

    if (actionType === 'refund') {
      await processRefundMutation.mutateAsync({
        id: activeRefund.id,
        amount: refundAmount,
        notes: actionReason,
      });
    } else if (actionType === 'reject') {
      await rejectMutation.mutateAsync({
        id: activeRefund.id,
        reason: actionReason,
      });
    }
    setActiveRefund(null);
    setActionType(null);
  };

  return (
    <PermissionGate allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']} requiredPermission="view:finance">
      <div className="space-y-6">
        <AdminPageHeader
          title="Refunds & Returns Workflow"
          description="Manage customer returns, authorized reversals, credit notes, and gateway refund dispatch."
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
              <Link href="/admin/finance">
                <AdminButton variant="primary" size="sm">
                  Finance Ledger
                </AdminButton>
              </Link>
            </div>
          }
        />

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search order #, customer name, reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="REQUESTED">REQUESTED (Pending Review)</option>
                <option value="APPROVED">APPROVED (Authorized)</option>
                <option value="PROCESSED">PROCESSED (Refunded)</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 shrink-0">
            Total records: <span className="font-bold text-slate-900">{total}</span>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <AdminTableSkeleton columns={7} rows={8} />
        ) : error ? (
          <AdminErrorState
            title="Failed to load refund claims"
            message="Could not retrieve refund claims from the commerce backend."
            onRetry={() => refetch()}
          />
        ) : filteredRefunds.length === 0 ? (
          <AdminEmptyState
            icon={<RotateCcw className="w-6 h-6" />}
            title="No refund records found"
            description="Active customer return and refund claims will appear here for operational authorization."
          />
        ) : (
          <div className="space-y-4">
            <AdminTable
              headers={[
                'Return ID',
                'Order #',
                'Customer',
                'Refund Amount',
                'Reason',
                'Status',
                'Requested Date',
                'Workflow Actions',
              ]}
            >
              {filteredRefunds.map((refund) => (
                <AdminTableRow key={refund.id}>
                  <AdminTableCell>
                    <code className="text-[11px] font-mono text-slate-700">#{refund.id}</code>
                  </AdminTableCell>

                  <AdminTableCell>
                    <Link
                      href={`/admin/orders?search=${refund.orderNumber}`}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      #{refund.orderNumber}
                    </Link>
                  </AdminTableCell>

                  <AdminTableCell>
                    <span className="text-xs font-medium text-slate-800">
                      {refund.customerName || 'Customer'}
                    </span>
                  </AdminTableCell>

                  <AdminTableCell>
                    <span className="font-bold text-slate-900 text-xs">
                      ₹{refund.amount.toLocaleString()}
                    </span>
                  </AdminTableCell>

                  <AdminTableCell>
                    <span className="text-xs text-slate-600 line-clamp-1 max-w-xs">
                      {refund.reason || 'Customer requested return'}
                    </span>
                  </AdminTableCell>

                  <AdminTableCell>
                    <AdminStatusBadge status={refund.status} size="sm" />
                  </AdminTableCell>

                  <AdminTableCell>
                    <span className="text-xs text-slate-500">
                      {new Date(refund.createdAt).toLocaleDateString()}
                    </span>
                  </AdminTableCell>

                  <AdminTableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      {refund.status === 'REQUESTED' && (
                        <>
                          <AdminButton
                            variant="outline"
                            size="xs"
                            className="text-teal-700 hover:bg-teal-50 border-teal-200"
                            onClick={() => approveMutation.mutate(refund.id)}
                            isLoading={approveMutation.isPending}
                            leftIcon={<Check className="w-3 h-3" />}
                          >
                            Approve
                          </AdminButton>
                          <AdminButton
                            variant="outline"
                            size="xs"
                            className="text-rose-700 hover:bg-rose-50 border-rose-200"
                            onClick={() => handleOpenReject(refund)}
                            leftIcon={<Ban className="w-3 h-3" />}
                          >
                            Reject
                          </AdminButton>
                        </>
                      )}

                      {refund.status === 'APPROVED' && (
                        <AdminButton
                          variant="primary"
                          size="xs"
                          onClick={() => handleOpenProcessRefund(refund)}
                          leftIcon={<RotateCcw className="w-3 h-3" />}
                        >
                          Process Refund
                        </AdminButton>
                      )}

                      {(refund.status === 'PROCESSED' || refund.status === 'REJECTED') && (
                        <span className="text-[11px] text-slate-400 font-medium">Closed</span>
                      )}
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>

            <AdminPagination
              currentPage={page}
              totalPages={Math.ceil(total / 15) || 1}
              onPageChange={(p) => setPage(p)}
              totalItems={total}
              itemsPerPage={15}
            />
          </div>
        )}

        {/* Action Modal (Process Refund / Reject) */}
        <AdminModal
          isOpen={Boolean(activeRefund && actionType)}
          onClose={() => {
            setActiveRefund(null);
            setActionType(null);
          }}
          title={actionType === 'refund' ? 'Process Gateway Refund' : 'Reject Return Request'}
          description={
            actionType === 'refund'
              ? `Authorize refund payout for Order #${activeRefund?.orderNumber}`
              : `Reject return claim for Order #${activeRefund?.orderNumber}`
          }
          size="md"
        >
          {activeRefund && (
            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Claimant:</span>
                  <span className="font-semibold text-slate-800">{activeRefund.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Claimed Reason:</span>
                  <span className="text-slate-700">{activeRefund.reason}</span>
                </div>
              </div>

              {actionType === 'refund' ? (
                <div>
                  <AdminInput
                    label="Authorized Refund Amount (₹)"
                    type="number"
                    required
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    helperText={`Maximum refundable: ₹${activeRefund.amount.toLocaleString()}`}
                  />
                  <div className="mt-3">
                    <AdminInput
                      label="Internal Reconciliation Notes"
                      placeholder="e.g. Returned item inspected and restocking fee deducted"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <AdminInput
                    label="Rejection Reason (Shared with customer)"
                    required
                    placeholder="e.g. Return window elapsed or item used/damaged"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <AdminButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveRefund(null);
                    setActionType(null);
                  }}
                >
                  Cancel
                </AdminButton>
                <AdminButton
                  type="submit"
                  variant={actionType === 'refund' ? 'primary' : 'danger'}
                  size="sm"
                  isLoading={processRefundMutation.isPending || rejectMutation.isPending}
                >
                  {actionType === 'refund' ? 'Dispatch Refund' : 'Confirm Rejection'}
                </AdminButton>
              </div>
            </form>
          )}
        </AdminModal>
      </div>
    </PermissionGate>
  );
}
