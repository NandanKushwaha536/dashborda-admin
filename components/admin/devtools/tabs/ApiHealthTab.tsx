'use client';

import React, { useState } from 'react';
import {
  Activity,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react';
import { useDevProbes } from '@/lib/hooks/useDevTools';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';

export function ApiHealthTab() {
  const {
    probes,
    isRunning,
    lastCheckedAll,
    runAllProbes,
    autoRefreshInterval,
    setAutoRefreshInterval,
  } = useDevProbes();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', ...Array.from(new Set(probes.map((p) => p.category)))];

  const filteredProbes = probes.filter((probe) => {
    const matchesSearch =
      probe.name.toLowerCase().includes(search.toLowerCase()) ||
      probe.endpoint.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || probe.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const healthyCount = probes.filter((p) => p.status === 'HEALTHY').length;
  const degradedCount = probes.filter((p) => p.status === 'DEGRADED').length;
  const errorCount = probes.filter((p) => p.status === 'ERROR').length;

  return (
    <div className="space-y-6">
      {/* Header controls bar */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            API SUBSYSTEM HEALTH & LATENCY BENCHMARK
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active real-time probes for backend controllers, database pipelines, and auth services.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Auto Refresh Select */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Auto:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
            >
              <option value={0}>Off</option>
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
            </select>
          </div>

          {/* Manual refresh button */}
          <button
            type="button"
            onClick={runAllProbes}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 disabled:text-blue-400 text-white rounded-lg text-xs font-mono font-medium transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Probing...' : 'Run Probes Now'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-2xs font-mono">
          <div className="text-[11px] text-slate-500">TOTAL PROBES</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{probes.length}</div>
        </div>
        <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 shadow-2xs font-mono">
          <div className="text-[11px] text-emerald-700">HEALTHY / NORMAL</div>
          <div className="text-xl font-bold text-emerald-800 mt-1">{healthyCount}</div>
        </div>
        <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200 shadow-2xs font-mono">
          <div className="text-[11px] text-amber-700">DEGRADED / RESTRICTED</div>
          <div className="text-xl font-bold text-amber-800 mt-1">{degradedCount}</div>
        </div>
        <div className="p-3.5 rounded-lg bg-rose-50/60 border border-rose-200 shadow-2xs font-mono">
          <div className="text-[11px] text-rose-700">FAILED / UNREACHABLE</div>
          <div className="text-xl font-bold text-rose-800 mt-1">{errorCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search probes or endpoints..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-mono text-slate-500 shrink-0">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-medium shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Probes Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs font-mono divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider select-none">
            <tr>
              <th className="px-4 py-3">Subsystem Probe</th>
              <th className="px-4 py-3">Endpoint Route</th>
              <th className="px-4 py-3">HTTP Status</th>
              <th className="px-4 py-3">Latency</th>
              <th className="px-4 py-3">Health State</th>
              <th className="px-4 py-3 text-right">Last Checked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredProbes.map((probe) => (
              <tr key={probe.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{probe.name}</div>
                  <div className="text-[11px] text-slate-500">{probe.details}</div>
                  {probe.error && (
                    <div className="text-[10px] text-rose-600 mt-0.5">{probe.error}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <code className="text-blue-600 bg-blue-50/70 px-2 py-0.5 rounded border border-blue-100 text-[11px]">
                    {probe.endpoint}
                  </code>
                </td>
                <td className="px-4 py-3">
                  {probe.httpStatus ? (
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                        probe.httpStatus >= 200 && probe.httpStatus < 300
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : probe.httpStatus >= 400 && probe.httpStatus < 500
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      HTTP {probe.httpStatus}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {probe.latencyMs !== undefined ? (
                    <span
                      className={`font-semibold ${
                        probe.latencyMs < 300
                          ? 'text-emerald-600'
                          : probe.latencyMs < 1000
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {probe.latencyMs}ms
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <DevStatusBadge status={probe.status} size="sm" pulse />
                </td>
                <td className="px-4 py-3 text-right text-[11px] text-slate-500">
                  {probe.lastChecked
                    ? new Date(probe.lastChecked).toLocaleTimeString()
                    : 'Pending'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lastCheckedAll && (
        <div className="text-right text-[11px] font-mono text-slate-500">
          Full sweep completed at: {new Date(lastCheckedAll).toLocaleString()}
        </div>
      )}
    </div>
  );
}
