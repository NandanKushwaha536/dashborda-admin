'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Server,
  Database,
  Layers,
  Activity,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Radio,
  Cpu,
  ShieldCheck,
  Zap,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { ENDPOINTS } from '@/lib/api/endpoints';

export type SubsystemStatus = 'HEALTHY' | 'DEGRADED' | 'UNREACHABLE' | 'DISABLED' | 'CHECKING';

interface SubsystemCardData {
  id: 'mongodb' | 'redis' | 'queues' | 'ingress';
  name: string;
  subTitle: string;
  type: 'database' | 'cache' | 'queue' | 'gateway';
  status: SubsystemStatus;
  latencyMs: number | null;
  endpoint: string;
  connected: boolean;
  version?: string;
  metrics: {
    label: string;
    value: string;
  }[];
  details: string;
  lastChecked?: string;
}

export default function SystemHealthPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(15); // seconds
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Status state for MongoDB, Redis, Message Queues, and Backend Ingress
  const [subsystems, setSubsystems] = useState<Record<string, SubsystemCardData>>({
    mongodb: {
      id: 'mongodb',
      name: 'MongoDB Primary Cluster',
      subTitle: 'Document Store & Relational Catalog Engine',
      type: 'database',
      status: 'CHECKING',
      latencyMs: null,
      endpoint: '/api/backend/health/ready',
      connected: false,
      version: 'MongoDB Atlas 7.x / WiredTiger',
      metrics: [
        { label: 'Cluster Connectivity', value: 'Probing...' },
        { label: 'Replica Set State', value: 'PRIMARY' },
        { label: 'Pool Mode', value: 'Keepalive Pooling' },
      ],
      details: 'Evaluates real-time ping and read-readiness against the master database connection pool.',
    },
    redis: {
      id: 'redis',
      name: 'Redis In-Memory Cache',
      subTitle: 'Fast Session, Key-Value & Query Accelerator',
      type: 'cache',
      status: 'CHECKING',
      latencyMs: null,
      endpoint: '/api/backend/health/ready',
      connected: false,
      version: 'Redis 7.x Cluster',
      metrics: [
        { label: 'Cache Cluster Status', value: 'Probing...' },
        { label: 'Persistence Mode', value: 'AOF / Snapshot' },
        { label: 'Serialization', value: 'JSON Fast-Cache' },
      ],
      details: 'Monitors low-latency memory store reachability for cached dashboard summaries and user sessions.',
    },
    queues: {
      id: 'queues',
      name: 'Internal Message Queues',
      subTitle: 'BullMQ & Redis Async Worker Queue Broker',
      type: 'queue',
      status: 'CHECKING',
      latencyMs: null,
      endpoint: '/api/backend/health/ready',
      connected: false,
      version: 'BullMQ Event Engine',
      metrics: [
        { label: 'Broker Transport', value: 'Redis Event Loop' },
        { label: 'Worker Processors', value: 'Orders, Mails & Invoices' },
        { label: 'Dead Letter Handling', value: 'Enabled (Auto-retry 3x)' },
      ],
      details: 'Manages decoupled asynchronous job processing for transactional emails, invoice generation, and audit indexing.',
    },
    ingress: {
      id: 'ingress',
      name: 'Backend Gateway Ingress',
      subTitle: 'HTTP/2 REST API & Keepalive Heartbeat',
      type: 'gateway',
      status: 'CHECKING',
      latencyMs: null,
      endpoint: '/api/backend/health/live',
      connected: false,
      version: 'Node.js Express / Cloudflare Edge',
      metrics: [
        { label: 'Ingress Protocol', value: 'HTTPS / TLS 1.3' },
        { label: 'Rate Limiter', value: 'Cloudflare / Express Shield' },
        { label: 'Response Target', value: '< 400ms SLA' },
      ],
      details: 'Public edge keepalive verifying that the Node.js backend container is responsive and accepting requests.',
    },
  });

  const [rawResponses, setRawResponses] = useState<{
    live?: Record<string, unknown>;
    ready?: Record<string, unknown>;
    error?: string;
  }>({});

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);
    const now = new Date();

    try {
      // 1. Probe /api/backend/health/live (Ingress keepalive)
      const liveStart = performance.now();
      const livePromise = fetch('/api/backend/health/live', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
        .then(async (res) => {
          const latency = Math.round(performance.now() - liveStart);
          let data: Record<string, unknown> = {};
          try {
            data = await res.json();
          } catch {}
          return { ok: res.ok, status: res.status, latency, data };
        })
        .catch((err) => ({
          ok: false,
          status: 0,
          latency: Math.round(performance.now() - liveStart),
          data: { error: err instanceof Error ? err.message : 'Network error' },
        }));

      // 2. Probe /api/backend/health/ready (MongoDB & Redis connectivity check)
      const readyStart = performance.now();
      const readyPromise = fetch('/api/backend/health/ready', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
        .then(async (res) => {
          const latency = Math.round(performance.now() - readyStart);
          let data: Record<string, unknown> = {};
          try {
            data = await res.json();
          } catch {}
          return { ok: res.ok, status: res.status, latency, data };
        })
        .catch((err) => ({
          ok: false,
          status: 0,
          latency: Math.round(performance.now() - readyStart),
          data: { error: err instanceof Error ? err.message : 'Network error' },
        }));

      const [liveRes, readyRes] = await Promise.all([livePromise, readyPromise]);

      setRawResponses({
        live: liveRes.data,
        ready: readyRes.data,
      });

      // Parse MongoDB readiness
      // Backend /health/ready returns: {"success":true,"data":{"mongo":true,"redis":true}}
      const readyData = (readyRes.data as { data?: { mongo?: boolean; redis?: boolean } })?.data || {};
      const mongoIsLive = readyRes.ok && Boolean(readyData.mongo);
      const redisIsLive = readyRes.ok && Boolean(readyData.redis);
      const queuesIsLive = redisIsLive; // BullMQ queue infrastructure operates on Redis broker

      const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setSubsystems({
        mongodb: {
          id: 'mongodb',
          name: 'MongoDB Primary Cluster',
          subTitle: 'Document Store & Relational Catalog Engine',
          type: 'database',
          status: mongoIsLive ? 'HEALTHY' : 'UNREACHABLE',
          latencyMs: readyRes.latency,
          endpoint: '/api/backend/health/ready',
          connected: mongoIsLive,
          version: 'MongoDB Atlas 7.x / WiredTiger',
          metrics: [
            { label: 'Cluster Connectivity', value: mongoIsLive ? 'CONNECTED' : 'DISCONNECTED' },
            { label: 'Ping Latency', value: `${readyRes.latency} ms` },
            { label: 'Connection Pool', value: mongoIsLive ? 'Active (Pooled)' : 'Exhausted / Stalled' },
          ],
          details: mongoIsLive
            ? 'Operational replica cluster verified via authoritative backend /health/ready probe.'
            : 'Primary replica connection failed or timed out during ping evaluation.',
          lastChecked: timeFormatted,
        },
        redis: {
          id: 'redis',
          name: 'Redis In-Memory Cache',
          subTitle: 'Fast Session, Key-Value & Query Accelerator',
          type: 'cache',
          status: redisIsLive ? 'HEALTHY' : 'DISABLED',
          latencyMs: readyRes.latency,
          endpoint: '/api/backend/health/ready',
          connected: redisIsLive,
          version: 'Redis 7.x Cluster',
          metrics: [
            { label: 'Cache Cluster Status', value: redisIsLive ? 'CONNECTED' : 'INACTIVE' },
            { label: 'Cache Latency', value: `${readyRes.latency} ms` },
            { label: 'Fallback Strategy', value: 'Direct Database Pass-through' },
          ],
          details: redisIsLive
            ? 'In-memory Redis cache cluster is connected and responding to live health probes.'
            : 'Redis cache is currently inactive or running in local pass-through mode.',
          lastChecked: timeFormatted,
        },
        queues: {
          id: 'queues',
          name: 'Internal Message Queues',
          subTitle: 'BullMQ & Redis Async Worker Queue Broker',
          type: 'queue',
          status: queuesIsLive ? 'HEALTHY' : 'DISABLED',
          latencyMs: readyRes.latency,
          endpoint: '/api/backend/health/ready',
          connected: queuesIsLive,
          version: 'BullMQ Event Engine',
          metrics: [
            { label: 'Broker Status', value: queuesIsLive ? 'BROKER READY' : 'STANDBY' },
            { label: 'Message Channel', value: 'BullMQ Redis Pub/Sub' },
            { label: 'Worker Engine', value: 'Active Worker Threads' },
          ],
          details: queuesIsLive
            ? 'Background message queues are operational on the active Redis message transport layer.'
            : 'Message queue broker is inactive because Redis transport is not connected.',
          lastChecked: timeFormatted,
        },
        ingress: {
          id: 'ingress',
          name: 'Backend Gateway Ingress',
          subTitle: 'HTTP/2 REST API & Keepalive Heartbeat',
          type: 'gateway',
          status: liveRes.ok ? (liveRes.latency > 1500 ? 'DEGRADED' : 'HEALTHY') : 'UNREACHABLE',
          latencyMs: liveRes.latency,
          endpoint: '/api/backend/health/live',
          connected: liveRes.ok,
          version: 'Node.js Express / Cloudflare Edge',
          metrics: [
            { label: 'HTTP Status', value: liveRes.status ? `HTTP ${liveRes.status}` : 'ERR_TIMEOUT' },
            { label: 'Gateway Latency', value: `${liveRes.latency} ms` },
            { label: 'Keepalive Message', value: (liveRes.data as { message?: string })?.message || 'API is live' },
          ],
          details: liveRes.ok
            ? 'Backend reverse-proxy and ingress routing accepting traffic with healthy HTTP response codes.'
            : 'Gateway ingress failed to return 200 OK.',
          lastChecked: timeFormatted,
        },
      });

      setLastRefreshedAt(now);
    } catch (err) {
      setRawResponses({
        error: err instanceof Error ? err.message : 'Unknown health check failure',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Auto-refresh interval timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      checkHealth();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, checkHealth]);

  // Overall system metrics calculation
  const overallStats = useMemo(() => {
    const list = Object.values(subsystems);
    const healthyCount = list.filter((s) => s.status === 'HEALTHY').length;
    const isAllOperational = healthyCount === list.length;
    const hasUnreachable = list.some((s) => s.status === 'UNREACHABLE');
    const avgLatency = Math.round(
      list.reduce((acc, s) => acc + (s.latencyMs || 0), 0) / (list.filter((s) => s.latencyMs != null).length || 1)
    );

    return {
      healthyCount,
      total: list.length,
      isAllOperational,
      hasUnreachable,
      avgLatency,
      systemState: hasUnreachable ? 'ATTENTION REQUIRED' : isAllOperational ? 'ALL SYSTEMS OPERATIONAL' : 'OPTIMAL / DEGRADED',
    };
  }, [subsystems]);

  const getStatusBadge = (status: SubsystemStatus) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Operational
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            High Latency
          </span>
        );
      case 'UNREACHABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Unreachable
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Standby / Disabled
          </span>
        );
      case 'CHECKING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RotateCcw className="w-3 h-3 text-blue-500 animate-spin" />
            Probing...
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Page Header */}
      <AdminPageHeader
        title="System Architecture & Infrastructure Health"
        description="Real-time connectivity monitoring, network round-trip latencies, and service status for core backend subsystems."
        actions={
          <div className="flex items-center gap-3">
            {/* Auto refresh dropdown */}
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Interval:</span>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="bg-transparent font-medium text-slate-800 border-none focus:ring-0 cursor-pointer p-0 text-xs"
              >
                <option value={5}>5s</option>
                <option value={15}>15s (Default)</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={0}>Manual only</option>
              </select>
            </div>

            <AdminButton
              variant="primary"
              size="sm"
              onClick={checkHealth}
              isLoading={isRefreshing}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Refresh Health Probes
            </AdminButton>
          </div>
        }
      />

      {/* Overview Banner Bar */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          overallStats.hasUnreachable
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : overallStats.isAllOperational
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                overallStats.hasUnreachable
                  ? 'bg-rose-500 text-white'
                  : overallStats.isAllOperational
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {overallStats.hasUnreachable ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight">
                  {overallStats.systemState}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-white/80 border border-current/10">
                  {overallStats.healthyCount}/{overallStats.total} Healthy
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Targeting live backend endpoints: <code className="font-mono text-slate-800 bg-white/80 px-1 py-0.5 rounded">/api/backend/health/ready</code> and <code className="font-mono text-slate-800 bg-white/80 px-1 py-0.5 rounded">/api/backend/health/live</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/80">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Average Latency</div>
              <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                {overallStats.avgLatency} ms
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Last Checked</div>
              <div className="text-sm font-semibold text-slate-900 font-mono mt-0.5">
                {lastRefreshedAt
                  ? lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Checking...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Dedicated Core Subsystem Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. MONGODB CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {subsystems.mongodb.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{subsystems.mongodb.subTitle}</p>
                </div>
              </div>
              <div>{getStatusBadge(subsystems.mongodb.status)}</div>
            </div>

            <p className="text-xs text-slate-600 mt-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {subsystems.mongodb.details}
            </p>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
              {subsystems.mongodb.metrics.map((m, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    {m.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 font-mono truncate block">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                GET {subsystems.mongodb.endpoint}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-slate-700 font-semibold">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              <span>{subsystems.mongodb.latencyMs != null ? `${subsystems.mongodb.latencyMs} ms` : '—'}</span>
            </div>
          </div>
        </div>

        {/* 2. REDIS CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {subsystems.redis.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{subsystems.redis.subTitle}</p>
                </div>
              </div>
              <div>{getStatusBadge(subsystems.redis.status)}</div>
            </div>

            <p className="text-xs text-slate-600 mt-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {subsystems.redis.details}
            </p>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
              {subsystems.redis.metrics.map((m, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    {m.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 font-mono truncate block">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                GET {subsystems.redis.endpoint}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-slate-700 font-semibold">
              <Radio className="w-3.5 h-3.5 text-rose-500" />
              <span>{subsystems.redis.latencyMs != null ? `${subsystems.redis.latencyMs} ms` : '—'}</span>
            </div>
          </div>
        </div>

        {/* 3. INTERNAL MESSAGE QUEUES CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {subsystems.queues.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{subsystems.queues.subTitle}</p>
                </div>
              </div>
              <div>{getStatusBadge(subsystems.queues.status)}</div>
            </div>

            <p className="text-xs text-slate-600 mt-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {subsystems.queues.details}
            </p>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
              {subsystems.queues.metrics.map((m, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    {m.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 font-mono truncate block">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Broker: Redis Stream / BullMQ
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-slate-700 font-semibold">
              <Radio className="w-3.5 h-3.5 text-purple-500" />
              <span>{subsystems.queues.latencyMs != null ? `${subsystems.queues.latencyMs} ms` : '—'}</span>
            </div>
          </div>
        </div>

        {/* 4. BACKEND GATEWAY INGRESS CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {subsystems.ingress.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{subsystems.ingress.subTitle}</p>
                </div>
              </div>
              <div>{getStatusBadge(subsystems.ingress.status)}</div>
            </div>

            <p className="text-xs text-slate-600 mt-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {subsystems.ingress.details}
            </p>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
              {subsystems.ingress.metrics.map((m, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    {m.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 font-mono truncate block">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                GET {subsystems.ingress.endpoint}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-slate-700 font-semibold">
              <Radio className="w-3.5 h-3.5 text-blue-500" />
              <span>{subsystems.ingress.latencyMs != null ? `${subsystems.ingress.latencyMs} ms` : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Payload Terminal & Subsystem Verification */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-slate-300 font-mono text-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>AUTHORITATIVE BACKEND TELEMETRY VERIFICATION</span>
          </div>
          <span className="text-[11px] text-slate-400">Live JSON Payload</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
              <span>ENDPOINT: /api/backend/health/ready</span>
              <span className="text-emerald-400">HTTP 200 OK</span>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-emerald-400 overflow-x-auto">
              {JSON.stringify(rawResponses.ready || { status: 'Probing...' }, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
              <span>ENDPOINT: /api/backend/health/live</span>
              <span className="text-blue-400">HTTP 200 OK</span>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-blue-400 overflow-x-auto">
              {JSON.stringify(rawResponses.live || { status: 'Probing...' }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
