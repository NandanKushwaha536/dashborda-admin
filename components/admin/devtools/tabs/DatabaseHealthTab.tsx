'use client';

import React, { useState } from 'react';
import { Database, ShieldAlert, CheckCircle2, Clock, Play, RefreshCw, AlertTriangle } from 'lucide-react';
import { useDevSystemHealth } from '@/lib/hooks/useDevTools';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';
import { DevJsonViewer } from '@/components/admin/devtools/DevJsonViewer';

export function DatabaseHealthTab() {
  const { data: health, isLoading, refetch } = useDevSystemHealth();
  const [isQueryTesting, setIsQueryTesting] = useState(false);
  const [queryBenchmark, setQueryBenchmark] = useState<{
    latencyMs: number;
    status: number;
    timestamp: string;
    resultSnippet?: string;
  } | null>(null);

  const runCatalogProbe = async () => {
    setIsQueryTesting(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/backend/products?limit=1', {
        method: 'GET',
        credentials: 'include',
      });
      const latency = Math.round(performance.now() - start);
      const data = await res.json().catch(() => null);

      setQueryBenchmark({
        latencyMs: latency,
        status: res.status,
        timestamp: new Date().toISOString(),
        resultSnippet: data ? `Query returned HTTP ${res.status}` : 'No response payload',
      });
    } catch {
      const latency = Math.round(performance.now() - start);
      setQueryBenchmark({
        latencyMs: latency,
        status: 500,
        timestamp: new Date().toISOString(),
        resultSnippet: 'Query benchmark failed',
      });
    } finally {
      setIsQueryTesting(false);
    }
  };

  const isConnected = health?.database.connected ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 font-mono flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            MONGODB OPERATIONAL TELEMETRY & DIAGNOSTICS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Database connectivity, operational pipeline latency, and query pipeline verification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-mono transition-colors border border-slate-200 shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh State</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">CONNECTION STATUS</span>
            <DevStatusBadge status={isConnected ? 'HEALTHY' : 'ERROR'} />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {isConnected ? 'Connected & Active' : 'Disconnected / Degraded'}
          </div>
          <div className="text-[11px] text-slate-500">Target: MongoDB Replica Cluster</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">HEALTH PROBE LATENCY</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {health?.database.latencyMs !== undefined ? `${health.database.latencyMs}ms` : 'Operational'}
          </div>
          <div className="text-[11px] text-slate-500">Subsystem round-trip latency</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">BENCHMARK PIPELINE</span>
            <Play className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {queryBenchmark ? `${queryBenchmark.latencyMs}ms` : 'Not run in session'}
          </div>
          <div className="text-[11px] text-slate-500">
            {queryBenchmark ? `Status: HTTP ${queryBenchmark.status}` : 'Click below to benchmark'}
          </div>
        </div>
      </div>

      {/* Benchmark Action Panel */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-mono font-semibold text-slate-800">
              QUERY BENCHMARK PROBE (PRODUCT COLLECTION)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Executes a lightweight, safe read query against the primary MongoDB product collection to measure real query execution time.
            </p>
          </div>
          <button
            type="button"
            onClick={runCatalogProbe}
            disabled={isQueryTesting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 disabled:text-blue-400 text-white rounded-lg text-xs font-mono font-medium transition-colors shadow-2xs cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isQueryTesting ? 'animate-pulse' : ''}`} />
            <span>{isQueryTesting ? 'Benchmarking...' : 'Execute Benchmark Probe'}</span>
          </button>
        </div>

        {queryBenchmark && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-800">Read query finished in:</span>
              <span className="font-bold text-emerald-700">{queryBenchmark.latencyMs}ms</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {new Date(queryBenchmark.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Security notice & Redaction */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-800">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          DATABASE SECURITY POLICY & BOUNDARIES
        </div>
        <div className="text-xs text-slate-600 font-mono space-y-2 leading-relaxed">
          <p>
            • <span className="text-slate-800 font-medium">Credentials Redacted:</span> In accordance with strict production security guidelines, MongoDB connection strings (<code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">MONGODB_URI</code>), auth credentials, and cluster host addresses are withheld from the browser.
          </p>
          <p>
            • <span className="text-slate-800 font-medium">No Arbitrary Shell Queries:</span> Unrestricted raw database shell execution (<code className="text-slate-800 bg-slate-200/60 px-1 py-0.5 rounded">db.eval</code> or ad-hoc query injections) is strictly prohibited to protect data integrity and tenant isolation.
          </p>
          <p>
            • <span className="text-slate-800 font-medium">Pool Telemetry:</span> Detailed MongoDB connection pool utilization (active sockets, queued checkouts) is currently not exposed by the backend health contract.
          </p>
        </div>
      </div>
    </div>
  );
}
