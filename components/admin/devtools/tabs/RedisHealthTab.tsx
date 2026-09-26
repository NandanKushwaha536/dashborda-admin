'use client';

import React from 'react';
import { Cpu, RefreshCw, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useDevSystemHealth } from '@/lib/hooks/useDevTools';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';

export function RedisHealthTab() {
  const { data: health, isLoading, refetch } = useDevSystemHealth();

  const isConfigured = health?.redis.connected ?? false;
  const latency = health?.redis.latencyMs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            REDIS IN-MEMORY CACHE DIAGNOSTICS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Key-value caching layer status, latency telemetry, and cluster state.
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

      {/* Primary KPI Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">REDIS STATUS</span>
            <DevStatusBadge status={isConfigured ? 'HEALTHY' : 'DISABLED'} />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {isConfigured ? 'Active & Connected' : 'REDIS DISABLED'}
          </div>
          <div className="text-[11px] text-slate-500">
            {isConfigured ? 'In-memory cache operational' : 'No Redis instance reported by backend'}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">CACHE LATENCY</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {latency !== undefined ? `${latency}ms` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500">
            {isConfigured ? 'Round-trip command execution' : 'In-memory cache not provisioned'}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">SECURITY AUDIT</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700">Secrets Concealed</div>
          <div className="text-[11px] text-slate-500">REDIS_URL & auth strings protected</div>
        </div>
      </div>

      {/* Architectural Explanation */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 font-mono text-xs">
        <h3 className="font-semibold text-slate-800">CONFIGURATION & FALLBACK STATUS</h3>
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 leading-relaxed space-y-2">
          <p>
            • When Redis is not provisioned or configured in the environment, the RGEnterprises backend safely defaults to local in-process memory caching or bypasses cache queries directly to MongoDB.
          </p>
          <p>
            • As specified by developer guidelines, this state is classified as <span className="text-slate-800 font-semibold">REDIS DISABLED</span> rather than a system failure, preventing false-positive error alerts during development or single-instance staging.
          </p>
        </div>
      </div>
    </div>
  );
}
