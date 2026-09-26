'use client';

import React from 'react';
import { Layers, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useDevSystemHealth, useDevProbes } from '@/lib/hooks/useDevTools';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';

export function IntegrationStatusTab() {
  const { data: health, isLoading: isHealthLoading, refetch: refetchHealth } = useDevSystemHealth();
  const { probes, runAllProbes, isRunning: isProbing } = useDevProbes();

  const handleRefresh = () => {
    refetchHealth();
    runAllProbes();
  };

  // Find probe statuses
  const healthProbe = probes.find((p) => p.endpoint === '/health');
  const csrfProbe = probes.find((p) => p.endpoint === '/auth/csrf-token');
  const sessionProbe = probes.find((p) => p.endpoint === '/users/me');

  const integrations = [
    {
      name: 'Backend API Gateway',
      type: 'Core Ingress',
      endpoint: '/health',
      status: healthProbe ? (healthProbe.status === 'HEALTHY' ? 'CONNECTED' : healthProbe.status) : 'CONNECTED',
      latency: healthProbe?.latencyMs,
      details: 'Next.js proxy route to Render Express backend.',
    },
    {
      name: 'MongoDB Cluster',
      type: 'Primary Data Store',
      endpoint: 'Mongoose Replica Set',
      status: health?.database.connected ? 'CONNECTED' : 'DISCONNECTED',
      latency: health?.database.latencyMs,
      details: 'Product catalog, customer profiles, and commercial ledger persistence.',
    },
    {
      name: 'Redis In-Memory Cache',
      type: 'Caching & Queues',
      endpoint: 'Redis Instance',
      status: health?.redis.connected ? 'CONNECTED' : 'DISABLED',
      latency: health?.redis.latencyMs,
      details: 'Key-value cache layer and background queue coordinator.',
    },
    {
      name: 'Anti-CSRF Security Service',
      type: 'Security Middleware',
      endpoint: '/auth/csrf-token',
      status: csrfProbe ? (csrfProbe.status === 'HEALTHY' ? 'CONNECTED' : csrfProbe.status) : 'CONNECTED',
      latency: csrfProbe?.latencyMs,
      details: 'Dynamic cryptographic token issuer for POST/PUT/DELETE protection.',
    },
    {
      name: 'Admin Session Store',
      type: 'Authentication State',
      endpoint: '/users/me',
      status: sessionProbe ? (sessionProbe.status === 'HEALTHY' ? 'CONNECTED' : sessionProbe.status) : 'CONNECTED',
      latency: sessionProbe?.latencyMs,
      details: 'HttpOnly cookie token validator and admin role authorizer.',
    },
    {
      name: 'Logistics Control Application',
      type: 'Operations Hub',
      endpoint: process.env.NEXT_PUBLIC_LOGISTICS_APP_URL || 'Direct Linked',
      status: 'CONFIGURED',
      details: 'Subdomain or dedicated app routing for fulfillment & drivers.',
    },
  ];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            INTEGRATED SERVICES & SUBSYSTEM CONNECTIVITY
          </h2>
          <p className="text-slate-500 mt-0.5">
            Operational status of database, cache, auth, and external services.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isHealthLoading || isProbing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-colors border border-slate-200 shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isHealthLoading || isProbing ? 'animate-spin' : ''}`} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((svc) => (
          <div
            key={svc.name}
            className="p-5 rounded-xl bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-sm">{svc.name}</span>
                <DevStatusBadge status={svc.status} size="sm" pulse />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="px-1.5 py-0.5 rounded bg-slate-50 text-blue-700 border border-blue-200 font-medium">
                  {svc.type}
                </span>
                <span className="text-slate-500">Route: {svc.endpoint}</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{svc.details}</p>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Latency:</span>
              <span className="text-slate-800 font-semibold">
                {svc.latency !== undefined ? `${svc.latency}ms` : 'Operational'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
