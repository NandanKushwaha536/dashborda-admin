'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, RefreshCw, Eye, X, AlertCircle } from 'lucide-react';
import { useAuditLogs } from '@/lib/hooks/useAudit';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';
import { DevJsonViewer } from '@/components/admin/devtools/DevJsonViewer';
import { AuditLog } from '@/lib/api/types';

export function ErrorLogsTab() {
  const [inspectingError, setInspectingError] = useState<AuditLog | null>(null);

  const { data, isLoading, refetch } = useAuditLogs({
    limit: 50,
  });

  // Filter logs for FAILED or WARNING statuses
  const errorLogs = (data?.logs || []).filter(
    (log) => log.status === 'FAILED' || log.status === 'WARNING'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            BACKEND ERROR LOGS & FAILED TRANSACTIONS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational exceptions, validation errors, and failed administrative mutations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-emerald-700 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Secrets Redacted
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-mono transition-colors border border-slate-200 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Backend Architecture Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 flex items-start gap-3 shadow-2xs">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="text-slate-800 font-semibold">Backend Crash Log Notice:</span> Dedicated unhandled process crash logs are written directly to container runtime <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200 font-medium">stdout/stderr</code> on Render. The telemetry below surfaces all application-level errors and failed transactions recorded in the backend&apos;s persistent audit store.
        </div>
      </div>

      {/* Error Logs Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs font-mono divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider select-none">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Failed Operation</th>
              <th className="px-4 py-3">Entity Target</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-mono">
                  Loading backend error records...
                </td>
              </tr>
            ) : errorLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-mono">
                  <div className="text-emerald-700 font-semibold">No recent backend error events detected.</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    All recent administrative actions and controller executions succeeded.
                  </div>
                </td>
              </tr>
            ) : (
              errorLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200 text-[11px]">
                      {log.action}
                    </span>
                    {log.details && (
                      <div className="text-[11px] text-slate-500 mt-1 truncate max-w-xs">
                        {log.details}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {log.entity || log.target || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {log.actorName || log.actorEmail || log.actor || 'System'}
                  </td>
                  <td className="px-4 py-3">
                    <DevStatusBadge status={log.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setInspectingError(log)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Inspect error payload"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Error Modal */}
      {inspectingError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in font-sans">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl text-slate-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-semibold text-slate-900 font-mono">
                  Error Details: {inspectingError.action}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingError(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto font-mono text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                <div className="font-semibold text-rose-950">Failure Message:</div>
                <div className="mt-1 text-rose-800">{inspectingError.details || inspectingError.description || 'No descriptive error message was attached to this failure event.'}</div>
              </div>

              <div>
                <div className="text-slate-600 font-semibold mb-1">
                  FULL AUDIT ERROR RECORD (ALL TOKENS REDACTED)
                </div>
                <DevJsonViewer data={inspectingError} title="Sanitized Error JSON" />
              </div>
            </div>

            <div className="flex justify-end px-5 py-3 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setInspectingError(null)}
                className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs text-xs font-mono rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
