'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useTransactions } from '@/lib/hooks/useFinance';
import { Transaction } from '@/lib/api/types';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminPagination } from '@/components/admin/ui/AdminPagination';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { AdminModal } from '@/components/admin/ui/AdminModal';
import { PermissionGate } from '@/components/admin/auth/PermissionGate';

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const {
    data: txData,
    isLoading,
    error,
    refetch,
  } = useTransactions({
    page,
    limit: 15,
    type: 'PAYMENT',
  });

  const transactions = Array.isArray(txData?.transactions) ? txData.transactions : [];
  const total = txData?.total || 0;

  const filteredTransactions = transactions.filter((tx) => {
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesId = tx.transactionId?.toLowerCase().includes(q);
      const matchesOrder = tx.orderNumber?.toLowerCase().includes(q);
      const matchesGateway = tx.paymentGateway?.toLowerCase().includes(q);
      if (!matchesId && !matchesOrder && !matchesGateway) return false;
    }
    return true;
  });

  return (
    <PermissionGate allowedRoles={['SUPER_ADMIN', 'ADMIN']} requiredPermission="view:finance">
      <div className="space-y-6">
        <AdminPageHeader
          title="Payment Transactions Ledger"
          description="Direct reconciliation of gateway settlements, customer charges, and real-time payment states."
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
                  Finance Overview
                </AdminButton>
              </Link>
            </div>
          }
        />

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transaction ID, order number, or gateway..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="w-44">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="SUCCESS">SUCCESS / Captured</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 shrink-0">
            Total recorded payments: <span className="font-bold text-slate-900">{total}</span>
          </div>
        </div>

        {/* Payments Table */}
        {isLoading ? (
          <AdminTableSkeleton columns={6} rows={10} />
        ) : error ? (
          <AdminErrorState
            title="Failed to load payment transactions"
            message="Could not retrieve transaction records from the payment backend service."
            onRetry={() => refetch()}
          />
        ) : filteredTransactions.length === 0 ? (
          <AdminEmptyState
            icon={<CreditCard className="w-6 h-6" />}
            title="No payment transactions found"
            description="Verified customer checkout settlements and gateway events will be recorded here in real-time."
          />
        ) : (
          <div className="space-y-4">
            <AdminTable
              headers={[
                'Transaction ID',
                'Order #',
                'Gateway / Reference',
                'Amount',
                'Status',
                'Recorded At',
                'Actions',
              ]}
            >
              {filteredTransactions.map((tx) => (
                <AdminTableRow key={tx.id || tx.transactionId}>
                  <AdminTableCell>
                    <code className="text-[11px] font-mono font-semibold text-slate-900">
                      {tx.transactionId || tx.id}
                    </code>
                  </AdminTableCell>

                  <AdminTableCell>
                    <Link
                      href={`/admin/orders?search=${tx.orderNumber}`}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      #{tx.orderNumber}
                    </Link>
                  </AdminTableCell>

                  <AdminTableCell>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-700">
                        {tx.paymentGateway || 'Razorpay'}
                      </span>
                    </div>
                  </AdminTableCell>

                  <AdminTableCell>
                    <span className="font-bold text-slate-900 text-xs">
                      ₹{tx.amount.toLocaleString()}
                    </span>
                  </AdminTableCell>

                  <AdminTableCell>
                    <AdminStatusBadge status={tx.status} size="sm" />
                  </AdminTableCell>

                  <AdminTableCell>
                    <span className="text-xs text-slate-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </AdminTableCell>

                  <AdminTableCell align="right">
                    <AdminButton
                      variant="ghost"
                      size="xs"
                      onClick={() => setSelectedTx(tx)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Details
                    </AdminButton>
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

        {/* Transaction Detail Modal */}
        <AdminModal
          isOpen={Boolean(selectedTx)}
          onClose={() => setSelectedTx(null)}
          title="Payment Transaction Verification"
          description="Read-only commercial payment gateway telemetry."
          size="md"
        >
          {selectedTx && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Transaction Reference</span>
                  <code className="font-mono font-bold text-slate-900">{selectedTx.transactionId}</code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Associated Order Number</span>
                  <span className="font-semibold text-blue-600">#{selectedTx.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Gateway</span>
                  <span className="font-semibold text-slate-800">{selectedTx.paymentGateway || 'Razorpay PG'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Transaction Status</span>
                  <AdminStatusBadge status={selectedTx.status} size="sm" />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
                  <span className="font-bold text-slate-700">Gross Amount</span>
                  <span className="font-bold text-slate-900">₹{selectedTx.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Timestamp</span>
                  <span>{new Date(selectedTx.timestamp).toUTCString()}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTx(null)}
                >
                  Close
                </AdminButton>
              </div>
            </div>
          )}
        </AdminModal>
      </div>
    </PermissionGate>
  );
}
