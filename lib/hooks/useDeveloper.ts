'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { getStepUpToken, stepUpHeaders } from './useStepUp';

export type CheckStatus = 'ok' | 'warn' | 'fail' | 'skipped';

export interface DiagnosticCheck {
  id: string;
  title: string;
  status: CheckStatus;
  detail: string;
  fix?: string;
  latencyMs?: number;
}

export interface DiagnosticGroup {
  id: string;
  title: string;
  status: CheckStatus;
  checks: DiagnosticCheck[];
}

export interface RecordedError {
  at: string;
  requestId?: string;
  method: string;
  route: string;
  status: number;
  area: string;
  name: string;
  message: string;
  location?: string;
}

export interface SlowRequest {
  at: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
}

export interface TrafficSummary {
  windowMinutes: number;
  total: number;
  clientErrors: number;
  serverErrors: number;
  unauthorized: number;
  rateLimited: number;
  averageDurationMs: number;
}

/** GET /admin/developer-tools/diagnostics (backend diagnostics.service.ts). */
export interface DiagnosticsReport {
  checkedAt: string;
  durationMs: number;
  deep: boolean;
  environment: string;
  overall: 'healthy' | 'degraded' | 'down';
  counts: Record<CheckStatus, number>;
  firstProblem: (DiagnosticCheck & { group: string }) | null;
  groups: DiagnosticGroup[];
  recentErrors: RecordedError[];
  slowRequests: SlowRequest[];
  traffic: { last15Minutes: TrafficSummary; lastHour: TrafficSummary; recordingSince: string };
}

export interface ServerOverview {
  environment: string;
  nodeVersion: string;
  uptimeSeconds: number;
  memory: { rssMb: number; heapUsedMb: number; heapTotalMb: number };
  dependencies: { mongo: string; redis: string; redisLatencyMs: number | null; notificationQueue: string };
  queue: Record<string, number>;
}

export interface QueueJob {
  id: string;
  name: string;
  status: string;
  attemptsMade: number;
  timestamp: number;
  failedReason: string | null;
}

export interface AuditEntry {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  createdAt: string;
  ip?: string;
  actor?: { name?: string; email?: string; role?: string } | null;
  metadata?: Record<string, unknown>;
}

/** Collections the backend lets developers read (admin-developer.controller.ts COLLECTIONS). */
export const DATABASE_COLLECTIONS = [
  'Order',
  'Payment',
  'Product',
  'Category',
  'Brand',
  'User',
  'Coupon',
  'Warehouse',
  'WarehouseStock',
  'InventoryMovement',
  'Notification',
  'AuditLog',
] as const;

const data = <T,>(res: { data?: T }): T => res.data as T;

export function useDiagnostics(deep: boolean, enabled = true) {
  return useQuery({
    queryKey: queryKeys.developer.diagnostics(deep),
    queryFn: async () => data(await api.get<{ data?: DiagnosticsReport }>(ENDPOINTS.developer.diagnostics, { params: deep ? { deep: 'true' } : undefined })),
    enabled,
    staleTime: 0,
  });
}

export function useServerOverview() {
  return useQuery({
    queryKey: queryKeys.developer.overview,
    queryFn: async () => data(await api.get<{ data?: ServerOverview }>(ENDPOINTS.developer.overview)),
    refetchInterval: 30_000,
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: queryKeys.developer.logs,
    queryFn: async () => data(await api.get<{ data?: AuditEntry[] }>(ENDPOINTS.developer.logs, { params: { limit: 100 } })) ?? [],
  });
}

export function useQueueJobs() {
  return useQuery({
    queryKey: queryKeys.developer.jobs,
    queryFn: async () =>
      data(await api.get<{ data?: { enabled: boolean; counts: Record<string, number>; jobs: QueueJob[] } }>(ENDPOINTS.developer.jobs, { params: { limit: 50 } })),
  });
}

export function useDatabaseRows(collection: string, search: string) {
  return useQuery({
    queryKey: queryKeys.developer.database(collection, search),
    queryFn: async () =>
      data(await api.get<{ data?: { rows: Record<string, unknown>[] } }>(ENDPOINTS.developer.database, { params: { collection, search: search || undefined, limit: 20 } }))?.rows ?? [],
    enabled: Boolean(collection),
  });
}

/** Maintenance flag as customers see it (public store settings). */
export function useMaintenanceMode() {
  return useQuery({
    queryKey: queryKeys.developer.maintenance,
    queryFn: async () => Boolean(data(await api.get<{ data?: { maintenanceMode?: boolean } }>(ENDPOINTS.developer.publicSettings))?.maintenanceMode),
  });
}

type ToolAction =
  | { kind: 'clearCache'; namespace: string }
  | { kind: 'retryJob'; jobId: string }
  | { kind: 'retryFailed' }
  | { kind: 'expireReservations' }
  | { kind: 'maintenance'; enabled: boolean };

/** Every developer action asks for the owner's password again (backend step-up). */
export function useDeveloperAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ action, password }: { action: ToolAction; password: string }) => {
      const headers = stepUpHeaders(await getStepUpToken(password));
      const D = ENDPOINTS.developer;
      switch (action.kind) {
        case 'clearCache':
          return api.post<{ message?: string }>(D.clearCache, { namespace: action.namespace }, { headers });
        case 'retryJob':
          return api.post<{ message?: string }>(D.retryJob, { jobId: action.jobId }, { headers });
        case 'retryFailed':
          return api.post<{ message?: string }>(D.retryFailed, {}, { headers });
        case 'expireReservations':
          return api.post<{ message?: string }>(D.expireReservations, {}, { headers });
        case 'maintenance':
          return api.post<{ message?: string }>(D.maintenance, { enabled: action.enabled }, { headers });
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['developer'] }),
  });
}
