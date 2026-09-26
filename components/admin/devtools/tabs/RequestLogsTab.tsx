'use client';

import React, { useState } from 'react';
import { FileCode2, Trash2, Clock, Eye, X, AlertCircle } from 'lucide-react';
import { useDevRequestLogs } from '@/lib/hooks/useDevTools';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';
import { DevJsonViewer } from '@/components/admin/devtools/DevJsonViewer';
import { DevRequestLog } from '@/lib/api/types';

export function RequestLogsTab() {
  const { logs, clearLogs } = useDevRequestLogs();
  const [inspectingRequest, setInspectingRequest] = useState<DevRequestLog | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 font-mono flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-blue-600" />
            HTTP REQUEST & PROXY SESSION DIAGNOSTICS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time proxy telemetry, response codes, latency timing, and sanitized payloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              type="button"
              onClick={clearLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg text-xs font-mono transition-colors border border-slate-200 shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Session Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Backend Status Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 flex items-start gap-3 shadow-2xs">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="text-slate-800 font-semibold">Backend Access Logging:</span> Centralized server-side request access logs (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200 font-medium">/admin/request-logs</code>) are not currently exposed as a queryable HTTP endpoint by the backend. The diagnostics below represent <span className="text-slate-900 font-semibold">live in-session HTTP requests</span> transmitted across the Next.js API client and proxy gateway during this session.
        </div>
      </div>

      {/* Session Requests Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs font-mono text-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 flex items-center justify-between">
          <span>ACTIVE SESSION REQUEST TELEMETRY</span>
          <span className="text-[11px] text-slate-500 font-normal">
            Captured: {logs.length} requests
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-2">
            <div>No HTTP requests recorded in this DevTools session yet.</div>
            <div className="text-[11px] text-slate-400">
              Run probes in <span className="text-blue-600 font-medium">API Health</span> or fire requests in <span className="text-blue-600 font-medium">API Explorer</span> to capture live traces.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider select-none border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Endpoint Route</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          log.method === 'GET'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.method === 'POST'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-blue-600 font-semibold">{log.endpoint}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          log.status >= 200 && log.status < 300
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.status >= 400 && log.status < 500
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.status || 'ERR'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          log.durationMs < 300
                            ? 'text-emerald-700'
                            : log.durationMs < 1000
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {log.durationMs}ms
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {log.requestId ? log.requestId.slice(0, 12) + '...' : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectingRequest(log)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Inspect request/response payload"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Request Modal */}
      {inspectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in font-sans">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl shadow-2xl text-slate-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900 font-mono">
                  HTTP Request Inspector: [{inspectingRequest.method}] {inspectingRequest.endpoint}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingRequest(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto font-mono text-xs">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500">Status:</span>{' '}
                  <span className="text-slate-900 font-bold">{inspectingRequest.status}</span>
                </div>
                <div>
                  <span className="text-slate-500">Duration:</span>{' '}
                  <span className="text-slate-900 font-bold">{inspectingRequest.durationMs}ms</span>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp:</span>{' '}
                  <span className="text-slate-900 font-medium">
                    {new Date(inspectingRequest.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {Boolean(inspectingRequest.requestBody) && (
                <div>
                  <div className="text-slate-600 font-semibold mb-1">
                    REQUEST BODY (REDACTED)
                  </div>
                  <DevJsonViewer data={inspectingRequest.requestBody} title="Request Body" />
                </div>
              )}

              <div>
                <div className="text-slate-600 font-semibold mb-1">
                  RESPONSE BODY (REDACTED)
                </div>
                <DevJsonViewer
                  data={inspectingRequest.responseBody}
                  title="Response Payload"
                />
              </div>

              {Boolean(inspectingRequest.headers) && (
                <div>
                  <div className="text-slate-600 font-semibold mb-1">
                    RESPONSE HEADERS (SECRETS REDACTED)
                  </div>
                  <DevJsonViewer
                    data={inspectingRequest.headers}
                    title="Response Headers"
                    defaultExpanded={false}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end px-5 py-3 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setInspectingRequest(null)}
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
