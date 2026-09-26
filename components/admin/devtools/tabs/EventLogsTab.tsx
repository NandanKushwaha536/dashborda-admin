'use client';

import React, { useState } from 'react';
import {
  ListFilter,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
  X,
  Clock,
} from 'lucide-react';
import { useAuditLogs } from '@/lib/hooks/useAudit';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';
import { DevJsonViewer } from '@/components/admin/devtools/DevJsonViewer';
import { AuditLog } from '@/lib/api/types';

export function EventLogsTab() {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [inspectingLog, setInspectingLog] = useState<AuditLog | null>(null);

  const { data, isLoading, refetch } = useAuditLogs({
    page,
    limit,
    search: search.trim() || undefined,
    action: actionFilter.trim() || undefined,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 font-mono flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-blue-600" />
            BACKEND AUDIT & DOMAIN EVENT STREAM
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of administrative actions, authentication attempts, and entity mutations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-mono transition-colors border border-slate-200 shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Stream</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search actor, action, IP..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="WARNING">WARNING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filteredLogs.length}</span> of{' '}
          <span className="text-slate-900 font-bold">{total}</span> events
        </div>
      </div>

      {/* Event Logs Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs font-mono divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider select-none">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Event Action</th>
              <th className="px-4 py-3">Entity / Target</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">IP Origin</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-mono">
                  Loading backend audit events...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-mono">
                  No audit events found matching the specified filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-900">{log.entity || log.target || '—'}</span>
                    {log.entityId && (
                      <span className="text-slate-400 text-[10px] block truncate max-w-[120px]">
                        ID: {log.entityId}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-900 font-medium">
                      {log.actorName || log.actorEmail || log.actor || 'System'}
                    </div>
                    {log.role && (
                      <span className="text-[10px] text-slate-500">{log.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-[11px]">
                    {log.ipAddress || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <DevStatusBadge status={log.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setInspectingLog(log)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Inspect event details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
          <div className="text-slate-500">
            Page <span className="text-slate-800 font-bold">{page}</span> of{' '}
            <span className="text-slate-800 font-bold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 border border-slate-200 shadow-2xs transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 border border-slate-200 shadow-2xs transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in font-sans">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl text-slate-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900 font-mono">
                  Event Record Inspector: {inspectingLog.action}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto font-mono text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500">Record ID:</span>{' '}
                  <span className="text-slate-900 font-medium">{inspectingLog.id}</span>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp:</span>{' '}
                  <span className="text-slate-900 font-medium">{inspectingLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-500">Actor:</span>{' '}
                  <span className="text-slate-900 font-medium">{inspectingLog.actor}</span>
                </div>
                <div>
                  <span className="text-slate-500">IP Address:</span>{' '}
                  <span className="text-slate-900 font-medium">{inspectingLog.ipAddress}</span>
                </div>
              </div>

              <div>
                <div className="text-slate-600 font-semibold mb-1">
                  FULL AUDIT EVENT DATA (REDACTED)
                </div>
                <DevJsonViewer data={inspectingLog} title="Audit Record JSON" />
              </div>
            </div>

            <div className="flex justify-end px-5 py-3 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs text-xs font-mono rounded-lg transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
