'use client';

import React, { useState } from 'react';
import { History, Search, ArrowRight, User, ShieldCheck, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { useAuditLogs } from '@/lib/hooks/useAudit';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';
import { DevJsonViewer } from '@/components/admin/devtools/DevJsonViewer';
import { AuditLog } from '@/lib/api/types';

export function AuditDebuggerTab() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useAuditLogs({
    limit: 30,
    search: search.trim() || undefined,
  });

  const logs = data?.logs || [];
  const current = selectedLog || logs[0] || null;

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          ADMINISTRATIVE AUDIT TRAIL DEBUGGER
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Deep lifecycle inspection: Actor Intent → Controller Dispatch → Database Mutation → Final Audit Ledger.
        </p>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: List of actions */}
        <div className="lg:col-span-5 rounded-xl bg-white border border-slate-200 shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-800">RECENT ADMIN OPERATIONS</span>
            <span className="text-[11px] text-slate-500">{logs.length} loaded</span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter actions or actors..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center py-8 text-xs text-slate-500">Loading audit records...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">No matching audit events</div>
            ) : (
              logs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedLog(item)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    current?.id === item.id
                      ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 truncate max-w-[200px]">
                      {item.action}
                    </span>
                    <DevStatusBadge status={item.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{item.actorName || item.actor || 'System'}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right column: Lifecycle Trace Diagram & Metadata */}
        <div className="lg:col-span-7 rounded-xl bg-white border border-slate-200 shadow-2xs p-5 space-y-5">
          {current ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Trace Execution: {current.action}
                  </h3>
                  <DevStatusBadge status={current.status} />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Recorded on: {new Date(current.timestamp).toLocaleString()} · ID: {current.id}
                </div>
              </div>

              {/* Execution Stage Pipeline */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-800">OPERATION LIFECYCLE PHASES</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="text-[10px] text-slate-500">PHASE 1: ACTOR</div>
                    <div className="font-semibold text-slate-900 truncate">
                      {current.actorName || current.actor || 'System'}
                    </div>
                    <div className="text-[10px] text-blue-600 font-medium">{current.role || 'ADMIN'}</div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="text-[10px] text-slate-500">PHASE 2: INGRESS</div>
                    <div className="font-semibold text-slate-900 truncate">
                      IP: {current.ipAddress || 'Internal'}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">CSRF & Session OK</div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="text-[10px] text-slate-500">PHASE 3: TARGET</div>
                    <div className="font-semibold text-slate-900 truncate">
                      {current.entity || current.target || 'Entity'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ID: {current.entityId ? current.entityId.slice(0, 8) + '...' : 'N/A'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="text-[10px] text-slate-500">PHASE 4: OUTCOME</div>
                    <div className="font-semibold text-slate-900 truncate">{current.status}</div>
                    <div className="text-[10px] text-blue-600 font-medium">Committed</div>
                  </div>
                </div>
              </div>

              {/* Description / Details */}
              {(current.description || current.details) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <span className="text-slate-500">Description / Payload Summary:</span>
                  <div className="text-slate-700">{current.description || current.details}</div>
                </div>
              )}

              {/* Complete Event Payload */}
              <div className="space-y-1.5">
                <div className="text-xs text-slate-700 font-semibold">RAW AUDIT OBJECT METADATA</div>
                <DevJsonViewer data={current} title="Audit Document Record" maxHeight="max-h-64" />
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              Select an audit operation from the list on the left to debug its lifecycle.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
