'use client';

import React, { useState } from 'react';
import { GitBranch, Search, AlertCircle, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { useDevRequestLogs } from '@/lib/hooks/useDevTools';
import { useAuditLogs } from '@/lib/hooks/useAudit';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';
import { DevJsonViewer } from '@/components/admin/devtools/DevJsonViewer';

export function RequestTraceTab() {
  const [traceIdInput, setTraceIdInput] = useState('');
  const [searchedId, setSearchedId] = useState('');

  const { logs: sessionLogs } = useDevRequestLogs();
  const { data: auditData } = useAuditLogs({ limit: 100 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedId(traceIdInput.trim());
  };

  // Find in session logs
  const matchingSessionLog = sessionLogs.find(
    (l) =>
      l.requestId?.toLowerCase() === searchedId.toLowerCase() ||
      l.id?.toLowerCase() === searchedId.toLowerCase()
  );

  // Find in audit logs
  const matchingAuditLogs = (auditData?.logs || []).filter(
    (a) =>
      a.id?.toLowerCase().includes(searchedId.toLowerCase()) ||
      a.entityId?.toLowerCase().includes(searchedId.toLowerCase())
  );

  const hasResult = Boolean(matchingSessionLog || matchingAuditLogs.length > 0);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-600" />
            REQUEST ID TRACE & EXECUTION CORRELATION
          </h2>
          <p className="text-slate-500 mt-0.5">
            Correlate an HTTP Request ID or Transaction ID across proxy gateway logs and audit trail events.
          </p>
        </div>

        {/* Input form */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <input
              type="text"
              value={traceIdInput}
              onChange={(e) => setTraceIdInput(e.target.value)}
              placeholder="Enter Request ID (e.g. req-1718... or audit ID)..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            disabled={!traceIdInput.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs"
          >
            Trace ID
          </button>
        </form>
      </div>

      {/* Results View */}
      {searchedId && !hasResult && (
        <div className="p-8 rounded-xl bg-white border border-slate-200 shadow-2xs text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
          <div className="text-slate-800 font-semibold">No Trace Matches Found</div>
          <div className="text-slate-500 max-w-md mx-auto">
            No session request logs or persistent audit entries matched ID <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200 font-medium">{searchedId}</code>.
            Execute requests in the API Explorer to generate traceable session records.
          </div>
        </div>
      )}

      {searchedId && hasResult && (
        <div className="space-y-4">
          {/* Matched Session Log */}
          {matchingSessionLog && (
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">HTTP PROXY INGRESS MATCH</span>
                  <span className="text-blue-600 font-medium">[{matchingSessionLog.method}] {matchingSessionLog.endpoint}</span>
                </div>
                <DevStatusBadge
                  status={matchingSessionLog.status >= 200 && matchingSessionLog.status < 400 ? 'HEALTHY' : 'ERROR'}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500">Status Code:</span>{' '}
                  <span className="text-slate-900 font-bold">{matchingSessionLog.status}</span>
                </div>
                <div>
                  <span className="text-slate-500">Execution Latency:</span>{' '}
                  <span className="text-slate-900 font-bold">{matchingSessionLog.durationMs}ms</span>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp:</span>{' '}
                  <span className="text-slate-900 font-medium">
                    {new Date(matchingSessionLog.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-slate-700 font-semibold mb-1">CORRELATED RESPONSE PAYLOAD</div>
                <DevJsonViewer data={matchingSessionLog.responseBody} title="Response Data" />
              </div>
            </div>
          )}

          {/* Matched Audit Records */}
          {matchingAuditLogs.length > 0 && (
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="font-semibold text-slate-800">
                  DATABASE AUDIT CORRELATIONS ({matchingAuditLogs.length})
                </span>
                <span className="text-slate-500">Persistent Records</span>
              </div>

              <div className="space-y-3">
                {matchingAuditLogs.map((audit) => (
                  <div key={audit.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-600">{audit.action}</span>
                      <DevStatusBadge status={audit.status} size="sm" />
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Actor: {audit.actorName || audit.actor || 'System'} · IP: {audit.ipAddress} · Entity: {audit.entity} ({audit.entityId || 'N/A'})
                    </div>
                    <DevJsonViewer data={audit} title="Audit Document" defaultExpanded={false} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!searchedId && (
        <div className="p-10 rounded-xl bg-white border border-slate-200 shadow-2xs text-center space-y-2 text-slate-500">
          <Clock className="w-5 h-5 text-slate-400 mx-auto" />
          <div>Enter a Request ID from HTTP response headers or an audit record to trace execution lifecycle.</div>
        </div>
      )}
    </div>
  );
}
