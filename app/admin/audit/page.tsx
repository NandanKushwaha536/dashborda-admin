'use client';

import React, { useState } from 'react';
import { useAuditLogs } from '@/lib/hooks/useAudit';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminSearchBar } from '@/components/admin/ui/AdminSearchBar';
import { AdminFilterBar } from '@/components/admin/ui/AdminFilterBar';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminPagination } from '@/components/admin/ui/AdminPagination';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { History, Shield, RotateCcw } from 'lucide-react';
import { PermissionGate } from '@/components/admin/auth/PermissionGate';

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading, error, refetch } = useAuditLogs({
    page,
    limit: 20,
    search,
    entity: entityFilter,
    action: actionFilter,
  });

  const logs = Array.isArray(data?.logs) ? data.logs : [];
  const total = data?.total || 0;

  const hasActiveFilters = Boolean(search || entityFilter || actionFilter);

  return (
    <PermissionGate allowedRoles={['SUPER_ADMIN', 'ADMIN']} requiredPermission="view:audit">
      <div className="space-y-6">
        <AdminPageHeader
          title="Immutable Audit Stream"
          description="Comprehensive audit trail tracking security events, status modifications, and stock adjustments."
          actions={
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Refresh Logs
            </AdminButton>
          }
        />

      <AdminFilterBar
        hasActiveFilters={hasActiveFilters}
        onReset={() => {
          setSearch('');
          setEntityFilter('');
          setActionFilter('');
          setPage(1);
        }}
      >
        <AdminSearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by actor or description..."
          className="w-full sm:w-72"
        />

        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Entities</option>
          <option value="ORDER">ORDER</option>
          <option value="PRODUCT">PRODUCT</option>
          <option value="INVENTORY">INVENTORY</option>
          <option value="AUTH">AUTH / SECURITY</option>
          <option value="USER">ADMIN USER</option>
        </select>
      </AdminFilterBar>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <AdminTableSkeleton rows={8} columns={5} />
        ) : error ? (
          <div className="py-12">
            <AdminErrorState
              title="Failed to load audit logs"
              message="Could not connect to the audit logging service."
              onRetry={() => refetch()}
            />
          </div>
        ) : logs.length === 0 ? (
          <AdminEmptyState
            icon={<History className="w-8 h-8" />}
            title="No audit entries"
            description="Zero events recorded matching the query parameters."
          />
        ) : (
          <>
            <AdminTable
              headers={[
                'Timestamp',
                'Actor',
                'Action / Type',
                'Target Entity',
                'Event Details',
                'Origin IP',
              ]}
            >
              {logs.map((log) => (
                <AdminTableRow key={log.id}>
                  <AdminTableCell className="text-xs text-slate-500 whitespace-nowrap font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </AdminTableCell>

                  <AdminTableCell>
                    <div className="font-semibold text-slate-900 text-xs">
                      {log.actorName || log.actor}
                    </div>
                    {log.actorEmail && (
                      <div className="text-[11px] text-slate-400">{log.actorEmail}</div>
                    )}
                  </AdminTableCell>

                  <AdminTableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                      {log.action}
                    </span>
                  </AdminTableCell>

                  <AdminTableCell className="text-xs font-medium text-slate-700 font-mono">
                    {log.entity} {log.entityId ? `#${log.entityId.slice(-6)}` : ''}
                  </AdminTableCell>

                  <AdminTableCell className="text-xs text-slate-600 max-w-xs truncate">
                    {log.details || log.description}
                  </AdminTableCell>

                  <AdminTableCell className="text-xs font-mono text-slate-400">
                    {log.ipAddress || '—'}
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>

            <AdminPagination
              currentPage={page}
              totalItems={total}
              pageSize={20}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>
      </div>
    </PermissionGate>
  );
}
