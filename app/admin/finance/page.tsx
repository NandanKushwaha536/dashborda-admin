'use client';

import React, { useState } from 'react';
import { useFinanceSummary, useTransactions } from '@/lib/hooks/useFinance';
import { Transaction } from '@/lib/api/types';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/ui/AdminStatCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminPagination } from '@/components/admin/ui/AdminPagination';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTableSkeleton, AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { BadgeDollarSign, Receipt, TrendingUp, RotateCcw, Download } from 'lucide-react';
import { PermissionGate } from '@/components/admin/auth/PermissionGate';

export default function FinancePage() {
  const [period, setPeriod] = useState<'30d' | '90d' | 'year'>('30d');
  const [page, setPage] = useState(1);

  const { data: summary, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = useFinanceSummary(period);
  const { data: txData, isLoading: txLoading, error: txError } = useTransactions({ page, limit: 15 });

  const transactions = Array.isArray(txData?.transactions) ? txData.transactions : [];
  const total = txData?.total || 0;

  return (
    <PermissionGate allowedRoles={['SUPER_ADMIN', 'ADMIN']} requiredPermission="view:finance">
      <div className="space-y-6">
        <AdminPageHeader
        title="Commercial Finance & Settlements"
        description="Payment reconciliation, tax collection reports, and commercial ledger audit."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as '30d' | '90d' | 'year')}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="year">Full Year</option>
            </select>

            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => refetchSummary()}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Refresh
            </AdminButton>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <AdminSkeleton className="h-4 w-1/2" />
              <AdminSkeleton className="h-8 w-2/3" />
            </div>
          ))
        ) : summaryError ? (
          <div className="col-span-full">
            <AdminErrorState
              title="Finance summary unavailable"
              message="Could not load financial summary metrics."
              onRetry={() => refetchSummary()}
            />
          </div>
        ) : (
          <>
            <AdminStatCard
              title="Gross Commerce Revenue"
              value={summary?.grossRevenue != null ? `₹${summary.grossRevenue.toLocaleString()}` : '—'}
              subtitle="All settled incoming orders"
              icon={<BadgeDollarSign className="w-5 h-5 text-blue-600" />}
            />
            <AdminStatCard
              title="Net Commerce Earnings"
              value={summary?.netRevenue != null ? `₹${summary.netRevenue.toLocaleString()}` : '—'}
              subtitle="Excluding GST & shipping"
              icon={<TrendingUp className="w-5 h-5 text-teal-600" />}
            />
            <AdminStatCard
              title="GST / Tax Collected"
              value={summary?.taxesCollected != null ? `₹${summary.taxesCollected.toLocaleString()}` : '—'}
              subtitle="Government statutory liabilities"
              icon={<Receipt className="w-5 h-5 text-indigo-600" />}
            />
            <AdminStatCard
              title="Refunds & Returns"
              value={summary?.refundsTotal != null ? `₹${summary.refundsTotal.toLocaleString()}` : '—'}
              subtitle="Settled refund adjustments"
              icon={<RotateCcw className="w-5 h-5 text-amber-600" />}
            />
          </>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Commercial Settlement Ledger</h3>
            <p className="text-xs text-slate-500 mt-0.5">Authoritative audit transaction records</p>
          </div>
        </div>

        {txLoading ? (
          <AdminTableSkeleton rows={6} columns={6} />
        ) : transactions.length === 0 ? (
          <AdminEmptyState
            icon={<Receipt className="w-8 h-8" />}
            title="No transactions recorded"
            description="Zero financial ledger entries recorded for this account."
          />
        ) : (
          <>
            <AdminTable
              headers={[
                'Reference ID',
                'Order #',
                'Date & Time',
                'Payment Method',
                'Amount',
                'Settlement Status',
              ]}
            >
              {transactions.map((tx: Transaction, index: number) => (
                <AdminTableRow key={`${tx.id || tx.transactionId || tx.orderNumber || 'transaction'}-${index}`}>
                  <AdminTableCell className="font-mono text-xs font-semibold text-slate-800">
                    {tx.id}
                  </AdminTableCell>

                  <AdminTableCell className="text-xs text-blue-600 font-medium">
                    #{tx.orderNumber}
                  </AdminTableCell>

                  <AdminTableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(tx.timestamp).toLocaleString()}
                  </AdminTableCell>

                  <AdminTableCell className="text-xs text-slate-700">
                    {tx.paymentGateway}
                  </AdminTableCell>

                  <AdminTableCell className="font-bold text-slate-900">
                    ₹{tx.amount.toLocaleString()}
                  </AdminTableCell>

                  <AdminTableCell>
                    <AdminStatusBadge status={tx.status} size="sm" />
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
      </div>
    </PermissionGate>
  );
}
