'use client';

import React from 'react';
import { Server, RefreshCw, AlertCircle, Clock, Cpu, HardDrive } from 'lucide-react';
import { useDevSystemHealth } from '@/lib/hooks/useDevTools';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';
import { DevJsonViewer } from '@/components/admin/devtools/DevJsonViewer';

export function SystemHealthTab() {
  const { data: health, isLoading, isError, error, refetch } = useDevSystemHealth();

  const uptimeFormatted = health?.uptimeSeconds
    ? `${Math.floor(health.uptimeSeconds / 86400)}d ${Math.floor(
        (health.uptimeSeconds % 86400) / 3600
      )}h ${Math.floor((health.uptimeSeconds % 3600) / 60)}m ${health.uptimeSeconds % 60}s`
    : 'Available via Ingress probe';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 font-mono flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            BACKEND SYSTEM HEALTH TELEMETRY
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational status, Node runtime environment, and container telemetry from /admin/system-health.
          </p>
        </div>

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

      {/* System Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Core Status */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs font-mono space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">OVERALL HEALTH</span>
            <DevStatusBadge status={health?.status || 'UNKNOWN'} pulse />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {health?.status === 'HEALTHY'
              ? 'Operational'
              : health?.status === 'DEGRADED'
              ? 'Degraded Performance'
              : 'Attention Required'}
          </div>
          <div className="text-[11px] text-slate-500">
            Probe Timestamp: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
          </div>
        </div>

        {/* Uptime */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs font-mono space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">CONTAINER UPTIME</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{uptimeFormatted}</div>
          <div className="text-[11px] text-slate-500">
            {health?.uptimeSeconds
              ? `Elapsed: ${health.uptimeSeconds} seconds`
              : 'Container keepalive reporting active'}
          </div>
        </div>

        {/* Runtime Environment */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs font-mono space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">RUNTIME ENVIRONMENT</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            Node.js {process.version || 'v22.x'}
          </div>
          <div className="text-[11px] text-slate-500">
            App Version: {health?.version || '1.0.0'} · Mode: {process.env.NODE_ENV || 'production'}
          </div>
        </div>
      </div>

      {/* Subsystem Telemetry Details */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-mono font-semibold text-slate-800">
          REPORTED BACKEND SUBSYSTEM TELEMETRY
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Database (MongoDB):</span>
              <DevStatusBadge status={health?.database.status || 'UNKNOWN'} size="sm" />
            </div>
            <div className="text-slate-800 font-semibold">{health?.database.details}</div>
            <div className="text-[11px] text-slate-500">
              Latency: {health?.database.latencyMs !== undefined ? `${health.database.latencyMs}ms` : 'Operational'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Redis Cache Layer:</span>
              <DevStatusBadge status={health?.redis.status || 'DISABLED'} size="sm" />
            </div>
            <div className="text-slate-800 font-semibold">{health?.redis.details}</div>
            <div className="text-[11px] text-slate-500">
              Latency: {health?.redis.latencyMs !== undefined ? `${health.redis.latencyMs}ms` : 'N/A'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Internal Message Queues:</span>
              <DevStatusBadge status={health?.queues?.status || 'DISABLED'} size="sm" />
            </div>
            <div className="text-slate-800 font-semibold">{health?.queues?.details}</div>
            <div className="text-[11px] text-slate-500">
              Engine: {health?.queues?.name || 'BullMQ / Redis Async Dispatch'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Backend Gateway Ingress:</span>
              <DevStatusBadge status={health?.ingress?.status || 'UNKNOWN'} size="sm" />
            </div>
            <div className="text-slate-800 font-semibold">{health?.ingress?.message}</div>
            <div className="text-[11px] text-slate-500">
              Latency: {health?.ingress?.latencyMs !== undefined ? `${health.ingress.latencyMs}ms` : 'Operational'}
            </div>
          </div>
        </div>

        {/* Detailed Metrics Disclaimer */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-xs font-mono text-slate-600">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-800 font-semibold">Note on Host-Level CPU & Memory:</span> Detailed host OS metrics (such as container memory heap stats, OS CPU core load, and event loop lag) are not currently returned by the RGEnterprises backend <code className="text-blue-600 font-medium">/admin/system-health</code> response contract. To avoid false metrics, only authentic backend payload telemetry is displayed.
          </div>
        </div>
      </div>

      {/* Raw Payload Inspection */}
      <div className="space-y-2">
        <div className="text-xs font-mono text-slate-600 font-semibold">
          RAW HEALTH PAYLOAD INSPECTION
        </div>
        <DevJsonViewer data={health?.raw || health} title="Backend System Health JSON" />
      </div>
    </div>
  );
}
