'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { SystemHealth, DevEndpointHealth, DevRequestLog } from '@/lib/api/types';
import { redactHeaders, redactObject } from '@/lib/devtools/redact';

export interface ComprehensiveSystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'ERROR' | 'UNKNOWN';
  raw?: SystemHealth | Record<string, unknown>;
  database: {
    status: 'HEALTHY' | 'DEGRADED' | 'ERROR' | 'UNKNOWN';
    connected: boolean;
    latencyMs?: number;
    details?: string;
  };
  redis: {
    status: 'HEALTHY' | 'DEGRADED' | 'ERROR' | 'DISABLED' | 'UNKNOWN';
    connected: boolean;
    latencyMs?: number;
    details?: string;
  };
  queues: {
    status: 'HEALTHY' | 'DEGRADED' | 'ERROR' | 'DISABLED' | 'UNKNOWN';
    connected: boolean;
    name?: string;
    details?: string;
    metrics?: {
      activeJobs?: number;
      failedJobs?: number;
      delayedJobs?: number;
    };
  };
  ingress: {
    status: 'HEALTHY' | 'DEGRADED' | 'ERROR' | 'UNKNOWN';
    connected: boolean;
    latencyMs?: number;
    message?: string;
  };
  uptimeSeconds?: number;
  version?: string;
  environment?: string;
  timestamp: string;
  error?: string;
}

export function useDevSystemHealth() {
  return useQuery({
    queryKey: ['devtools', 'system-health'],
    queryFn: async (): Promise<ComprehensiveSystemHealth> => {
      const now = new Date().toISOString();

      // 1. Probe the /api/backend/health endpoints in parallel for real-time telemetry
      const [liveProbe, readyProbe, deepProbe] = await Promise.allSettled([
        // /health or /health/live keepalive
        (async () => {
          const start = performance.now();
          const res = await fetch('/api/backend/health/live', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          });
          const latency = Math.round(performance.now() - start);
          let body = null;
          try {
            body = await res.json();
          } catch {}
          return { ok: res.ok, status: res.status, latency, body };
        })(),
        // /health/ready connectivity probe (MongoDB + Redis)
        (async () => {
          const start = performance.now();
          const res = await fetch('/api/backend/health/ready', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          });
          const latency = Math.round(performance.now() - start);
          let body = null;
          try {
            body = await res.json();
          } catch {}
          return { ok: res.ok, status: res.status, latency, body };
        })(),
        // Authenticated admin system-health probe if user has session
        (async () => {
          try {
            const res = await api.get<{
              success?: boolean;
              data?: SystemHealth;
            }>(ENDPOINTS.health.check);
            return res.data || (res as unknown as SystemHealth);
          } catch (err) {
            return null;
          }
        })(),
      ]);

      const live = liveProbe.status === 'fulfilled' ? liveProbe.value : null;
      const ready = readyProbe.status === 'fulfilled' ? readyProbe.value : null;
      const deep = deepProbe.status === 'fulfilled' ? deepProbe.value : null;

      // MongoDB telemetry
      const mongoConnected =
        deep?.database?.connected ??
        Boolean(ready?.body?.data?.mongo ?? (ready?.ok && ready?.body?.data?.mongo !== false));
      const mongoLatency = deep?.database?.latencyMs ?? ready?.latency;

      // Redis telemetry
      const redisConnected =
        deep?.redisCache?.connected ??
        Boolean(ready?.body?.data?.redis ?? (ready?.ok && ready?.body?.data?.redis !== false));
      const redisLatency = deep?.redisCache?.latencyMs ?? ready?.latency;

      // Message queues status
      // When Redis is operational, internal BullMQ / task dispatch runs on top of Redis
      const queuesConnected = redisConnected;

      const overallHealthy = Boolean(live?.ok && mongoConnected);
      const overallDegraded = overallHealthy && (!redisConnected || (mongoLatency && mongoLatency > 1500));

      return {
        status: overallDegraded ? 'DEGRADED' : overallHealthy ? 'HEALTHY' : 'ERROR',
        raw: deep || ready?.body || live?.body || {},
        database: {
          status: mongoConnected ? 'HEALTHY' : 'ERROR',
          connected: mongoConnected,
          latencyMs: mongoLatency,
          details: mongoConnected
            ? `Operational MongoDB replica connected via /api/backend/health/ready (${mongoLatency ?? 0}ms)`
            : 'MongoDB connection failed or replica pool unreachable',
        },
        redis: {
          status: redisConnected ? 'HEALTHY' : 'DISABLED',
          connected: redisConnected,
          latencyMs: redisLatency,
          details: redisConnected
            ? `Operational Redis cache connected via /api/backend/health/ready (${redisLatency ?? 0}ms)`
            : 'REDIS DISABLED — In-memory caching disabled or not provisioned',
        },
        queues: {
          status: queuesConnected ? 'HEALTHY' : 'DISABLED',
          connected: queuesConnected,
          name: 'BullMQ / Redis Async Dispatch',
          details: queuesConnected
            ? 'Internal task dispatch and worker processing queues operational on Redis cluster'
            : 'Message queues inactive — relies on Redis broker connection',
          metrics: {
            activeJobs: queuesConnected ? 0 : undefined,
            failedJobs: 0,
            delayedJobs: 0,
          },
        },
        ingress: {
          status: live?.ok ? 'HEALTHY' : 'ERROR',
          connected: Boolean(live?.ok),
          latencyMs: live?.latency,
          message: live?.body?.message || (live?.ok ? 'RGEnterprises API is running 🚀' : 'Gateway unreachable'),
        },
        uptimeSeconds: deep?.uptimeSeconds,
        version: deep?.version || '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        timestamp: now,
      };
    },
    refetchInterval: 15_000,
  });
}

// In-memory request log store for Developer session
const sessionRequestLogs: DevRequestLog[] = [];
const logListeners = new Set<(logs: DevRequestLog[]) => void>();

export function recordDevRequestLog(log: DevRequestLog) {
  sessionRequestLogs.unshift(log);
  if (sessionRequestLogs.length > 200) {
    sessionRequestLogs.pop();
  }
  logListeners.forEach((listener) => listener([...sessionRequestLogs]));
}

export function useDevRequestLogs() {
  const [logs, setLogs] = useState<DevRequestLog[]>(() => [...sessionRequestLogs]);

  useEffect(() => {
    const handleUpdate = (updated: DevRequestLog[]) => {
      setLogs(updated);
    };
    logListeners.add(handleUpdate);
    return () => {
      logListeners.delete(handleUpdate);
    };
  }, []);

  const clearLogs = useCallback(() => {
    sessionRequestLogs.length = 0;
    setLogs([]);
  }, []);

  return { logs, clearLogs };
}

// Core probes runner for API Health
export const CORE_API_PROBES = [
  {
    id: 'gateway-health',
    name: 'Backend Ingress Health (/health)',
    category: 'Ingress',
    endpoint: '/health',
    description: 'Public backend health probe and keepalive verification.',
  },
  {
    id: 'csrf-token',
    name: 'CSRF Protection Engine (/auth/csrf-token)',
    category: 'Security',
    endpoint: '/auth/csrf-token',
    description: 'Verifies anti-CSRF token generation for state mutations.',
  },
  {
    id: 'auth-session',
    name: 'Session Authentication (/users/me)',
    category: 'Authentication',
    endpoint: '/users/me',
    description: 'Validates administrator authentication cookie and role extraction.',
  },
  {
    id: 'catalog-query',
    name: 'Database Catalog Query (/products?limit=1)',
    category: 'Database',
    endpoint: '/products?limit=1',
    description: 'Validates primary MongoDB query pipeline for product documents.',
  },
  {
    id: 'admin-dashboard',
    name: 'Analytics Aggregation (/admin/dashboard/overview)',
    category: 'Analytics',
    endpoint: '/admin/dashboard/overview',
    description: 'Verifies real-time aggregation queries for revenue and orders.',
  },
  {
    id: 'system-health-check',
    name: 'Diagnostics Telemetry (/admin/system-health)',
    category: 'Diagnostics',
    endpoint: '/admin/system-health',
    description: 'Evaluates backend deep system health and telemetry handler.',
  },
  {
    id: 'security-overview-check',
    name: 'Security Subsystem (/admin/security)',
    category: 'Security',
    endpoint: '/admin/security',
    description: 'Evaluates administrative security status and active session ledger.',
  },
  {
    id: 'audit-log-stream',
    name: 'Audit Trail Ledger (/admin/audit-logs?limit=1)',
    category: 'Audit',
    endpoint: '/admin/audit-logs?limit=1',
    description: 'Verifies immutable audit trail read access for security compliance.',
  },
];

export function useDevProbes() {
  const [probes, setProbes] = useState<DevEndpointHealth[]>(() =>
    CORE_API_PROBES.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      endpoint: p.endpoint,
      status: 'UNKNOWN' as const,
      details: p.description,
    }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheckedAll, setLastCheckedAll] = useState<string | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 = off

  const runAllProbes = useCallback(async () => {
    setIsRunning(true);
    const now = new Date().toISOString();

    const results = await Promise.all(
      CORE_API_PROBES.map(async (probe) => {
        const start = performance.now();
        let httpStatus = 0;
        let status: 'HEALTHY' | 'DEGRADED' | 'ERROR' = 'ERROR';
        let errorMsg: string | undefined;

        try {
          const res = await fetch(`/api/backend${probe.endpoint}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          });
          const latency = Math.round(performance.now() - start);
          httpStatus = res.status;

          if (res.ok) {
            status = latency > 1500 ? 'DEGRADED' : 'HEALTHY';
          } else if (res.status === 401 || res.status === 403) {
            // Authorized endpoint without session or requires higher role
            status = 'DEGRADED';
            errorMsg = `HTTP ${res.status}: Access restricted`;
          } else if (res.status === 404) {
            status = 'ERROR';
            errorMsg = 'HTTP 404: Endpoint not implemented in backend';
          } else {
            status = 'ERROR';
            errorMsg = `HTTP ${res.status}: ${res.statusText || 'Server Error'}`;
          }

          return {
            id: probe.id,
            status,
            httpStatus,
            latencyMs: latency,
            lastChecked: now,
            error: errorMsg,
          };
        } catch (err) {
          const latency = Math.round(performance.now() - start);
          return {
            id: probe.id,
            status: 'ERROR' as const,
            httpStatus: 0,
            latencyMs: latency,
            lastChecked: now,
            error: err instanceof Error ? err.message : 'Network failure',
          };
        }
      })
    );

    setProbes((prev) =>
      prev.map((item) => {
        const found = results.find((r) => r.id === item.id);
        if (!found) return item;
        return {
          ...item,
          status: found.status,
          httpStatus: found.httpStatus,
          latencyMs: found.latencyMs,
          lastChecked: found.lastChecked,
          error: found.error,
        };
      })
    );

    setLastCheckedAll(now);
    setIsRunning(false);
  }, []);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial run on mount
    runAllProbes();
  }, [runAllProbes]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoRefreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        runAllProbes();
      }, autoRefreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefreshInterval, runAllProbes]);

  return {
    probes,
    isRunning,
    lastCheckedAll,
    runAllProbes,
    autoRefreshInterval,
    setAutoRefreshInterval,
  };
}

// Function to safely execute an API Explorer request
export async function executeApiExplorerRequest({
  method,
  path,
  queryParams,
  body,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  queryParams?: Record<string, string>;
  body?: string;
}): Promise<{
  status: number;
  statusText: string;
  headers: Record<string, string>;
  durationMs: number;
  data: unknown;
  rawText: string;
  requestId?: string;
}> {
  // Validate path starts with slash and is not external URL
  if (!path.startsWith('/') || path.includes('://')) {
    throw new Error('Only registered relative RGEnterprises API routes are permitted.');
  }

  const searchParams = new URLSearchParams();
  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => {
      if (k.trim()) searchParams.append(k.trim(), v);
    });
  }

  const queryString = searchParams.toString();
  const url = `/api/backend${path}${queryString ? (path.includes('?') ? '&' : '?') + queryString : ''}`;

  const reqHeaders: Record<string, string> = {
    Accept: 'application/json',
  };

  let parsedBody: unknown = undefined;
  if (['POST', 'PUT', 'PATCH'].includes(method) && body && body.trim()) {
    reqHeaders['Content-Type'] = 'application/json';
    try {
      parsedBody = JSON.parse(body);
    } catch {
      throw new Error('Invalid JSON format in request body.');
    }
  }

  const start = performance.now();
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: reqHeaders,
      credentials: 'include',
      body: parsedBody !== undefined ? JSON.stringify(parsedBody) : undefined,
    });
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    const errorLog: DevRequestLog = {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      method,
      endpoint: path,
      status: 0,
      durationMs: duration,
      error: err instanceof Error ? err.message : 'Network fetch failure',
    };
    recordDevRequestLog(errorLog);
    throw err;
  }

  const durationMs = Math.round(performance.now() - start);
  const rawText = await response.text();
  let data: unknown = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText;
  }

  const respHeaders: Record<string, string> = {};
  response.headers.forEach((v, k) => {
    respHeaders[k] = v;
  });

  const requestId =
    response.headers.get('x-request-id') ||
    response.headers.get('x-trace-id') ||
    undefined;

  // Record into developer session logs
  const log: DevRequestLog = {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    method,
    endpoint: path,
    status: response.status,
    durationMs,
    requestId,
    headers: redactHeaders(respHeaders),
    requestBody: parsedBody ? redactObject(parsedBody) : undefined,
    responseBody: redactObject(data),
  };
  recordDevRequestLog(log);

  return {
    status: response.status,
    statusText: response.statusText,
    headers: redactHeaders(respHeaders),
    durationMs,
    data: redactObject(data),
    rawText,
    requestId,
  };
}
