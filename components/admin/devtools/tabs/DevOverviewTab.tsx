'use client';

import React from 'react';
import {
  Activity,
  Server,
  Database,
  Cpu,
  Layers,
  Clock,
  Webhook,
  Shield,
  Tag,
  RefreshCw,
  Terminal,
  ArrowUpRight,
  Compass,
  AlertTriangle,
} from 'lucide-react';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';
import { useDevSystemHealth, useDevProbes } from '@/lib/hooks/useDevTools';

interface DevOverviewTabProps {
  onSelectTab: (tabId: string) => void;
}

export function DevOverviewTab({ onSelectTab }: DevOverviewTabProps) {
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useDevSystemHealth();
  const { probes, runAllProbes, isRunning: probesRunning } = useDevProbes();

  const handleRefreshAll = () => {
    refetchHealth();
    runAllProbes();
  };

  const healthyCount = probes.filter((p) => p.status === 'HEALTHY').length;
  const degradedCount = probes.filter((p) => p.status === 'DEGRADED').length;
  const errorCount = probes.filter((p) => p.status === 'ERROR').length;

  const uptimeFormatted = health?.uptimeSeconds
    ? `${Math.floor(health.uptimeSeconds / 86400)}d ${Math.floor(
        (health.uptimeSeconds % 86400) / 3600
      )}h ${Math.floor((health.uptimeSeconds % 3600) / 60)}m`
    : 'Available via Ingress';

  return (
    <div className="space-y-6">
      {/* Header telemetry banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-sm font-semibold text-slate-900 font-mono">
              RGENTERPRISES DEVELOPER CONTROL CENTER
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time backend telemetry, service diagnostics, and API debugging interface.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-slate-400 font-mono">ENVIRONMENT</div>
            <div className="text-xs font-semibold text-slate-700 font-mono">
              {process.env.NODE_ENV?.toUpperCase() || 'PRODUCTION'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={healthLoading || probesRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${healthLoading || probesRunning ? 'animate-spin' : ''}`}
            />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Primary Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Backend API Gateway */}
        <div
          onClick={() => onSelectTab('api-health')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
              <Server className="w-4 h-4" />
            </div>
            <DevStatusBadge status={health?.status || 'UNKNOWN'} pulse />
          </div>
          <div className="mt-3">
            <div className="text-xs font-medium text-slate-400 font-mono">BACKEND API GATEWAY</div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5 group-hover:text-blue-600 transition-colors">
              Express Core Runtime
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Probes: {healthyCount} OK · {degradedCount} Degraded · {errorCount} Err
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div
          onClick={() => onSelectTab('database-health')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
              <Database className="w-4 h-4" />
            </div>
            <DevStatusBadge status={health?.database.status || 'UNKNOWN'} />
          </div>
          <div className="mt-3">
            <div className="text-xs font-medium text-slate-400 font-mono">DATABASE (MONGODB)</div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5 group-hover:text-emerald-600 transition-colors">
              {health?.database.connected ? 'Replica Set Connected' : 'Unreachable'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Latency: {health?.database.latencyMs !== undefined ? `${health.database.latencyMs}ms` : 'Operational'}
            </div>
          </div>
        </div>

        {/* Redis Status */}
        <div
          onClick={() => onSelectTab('redis-health')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
              <Cpu className="w-4 h-4" />
            </div>
            <DevStatusBadge status={health?.redis.status || 'DISABLED'} />
          </div>
          <div className="mt-3">
            <div className="text-xs font-medium text-slate-400 font-mono">REDIS CACHE LAYER</div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5 group-hover:text-amber-600 transition-colors">
              {health?.redis.connected ? 'Cluster Active' : 'REDIS DISABLED'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              {health?.redis.connected ? `${health.redis.latencyMs || 0}ms latency` : 'Not provisioned in backend'}
            </div>
          </div>
        </div>

        {/* BullMQ / Background Queues */}
        <div
          onClick={() => onSelectTab('queue-health')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
            <DevStatusBadge status="NOT_IMPLEMENTED" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-medium text-slate-400 font-mono">QUEUE HEALTH (BULLMQ)</div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5 group-hover:text-purple-600 transition-colors">
              Queue Telemetry
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Not exposed by backend HTTP API
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Background Workers */}
        <div
          onClick={() => onSelectTab('background-jobs')}
          className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 shadow-2xs cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              BACKGROUND JOBS
            </span>
            <DevStatusBadge status="NOT_IMPLEMENTED" size="sm" />
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1.5 font-mono">
            Workers Telemetry (Pending)
          </div>
        </div>

        {/* Webhooks */}
        <div
          onClick={() => onSelectTab('webhooks')}
          className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 shadow-2xs cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-500 font-mono">
              <Webhook className="w-3.5 h-3.5 text-slate-400" />
              WEBHOOKS
            </span>
            <DevStatusBadge status="NOT_IMPLEMENTED" size="sm" />
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1.5 font-mono">
            Razorpay / Event Handlers
          </div>
        </div>

        {/* Security Diagnostics */}
        <div
          onClick={() => onSelectTab('security-diagnostics')}
          className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 shadow-2xs cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-500 font-mono">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              SECURITY
            </span>
            <DevStatusBadge status="HEALTHY" size="sm" />
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1.5 font-mono">
            CSRF, RBAC, Proxy Isolated
          </div>
        </div>

        {/* Release / Version */}
        <div
          onClick={() => onSelectTab('release-version')}
          className="p-3.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 shadow-2xs cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-500 font-mono">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              RELEASE
            </span>
            <span className="font-mono text-xs text-blue-600 font-semibold">v1.0.0</span>
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1.5 font-mono">
            Admin v1.0.0 / Node 22+
          </div>
        </div>
      </div>

      {/* Developer Quick Navigation & Live Probes Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Live Endpoint Health Probes */}
        <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 font-mono flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                ACTIVE ENDPOINT HEALTH PROBES
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Reachability and response times across critical API subsystems.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('api-health')}
              className="text-xs font-mono text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              View All Probes <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {probes.slice(0, 5).map((probe) => (
              <div
                key={probe.id}
                className="py-3 flex items-center justify-between gap-4 text-xs font-mono"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                      {probe.category}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">{probe.name}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] truncate mt-0.5">
                    {probe.endpoint}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {probe.latencyMs !== undefined && (
                    <span className="text-slate-500 text-[11px]">
                      {probe.latencyMs}ms
                    </span>
                  )}
                  {probe.httpStatus ? (
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded border ${
                        probe.httpStatus >= 200 && probe.httpStatus < 300
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : probe.httpStatus >= 400 && probe.httpStatus < 500
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      HTTP {probe.httpStatus}
                    </span>
                  ) : null}
                  <DevStatusBadge status={probe.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right col: Quick Actions & Developer Links */}
        <div className="rounded-xl bg-white border border-slate-200 shadow-2xs p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 font-mono flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-600" />
            DEVELOPER ACTIONS
          </h3>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onSelectTab('api-explorer')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group cursor-pointer"
            >
              <div>
                <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 font-mono">
                  Launch API Explorer
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Test and debug registered RGEnterprises endpoints.
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('event-logs')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group cursor-pointer"
            >
              <div>
                <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 font-mono">
                  Inspect Event Logs
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Stream audit mutations and administrative actions.
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('request-trace')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group cursor-pointer"
            >
              <div>
                <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 font-mono">
                  Trace Request ID
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Track specific execution timelines and errors.
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('security-diagnostics')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group cursor-pointer"
            >
              <div>
                <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 font-mono">
                  Security Diagnostics
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Audit RBAC, CSRF, and reverse-proxy isolation.
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-800 font-semibold">Backend Authorization Enforced:</span> Only
              tools authorized for your administrator role are active. Raw credentials and direct DB
              connections are concealed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
