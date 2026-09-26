'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { AuditLog } from '@/lib/api/types';
import { normalizeList, normalizeTotal } from '@/lib/api/normalize';

export function useAuditLogs(params: { page?: number; limit?: number; actor?: string; action?: string; search?: string; entity?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.audit.logs(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: AuditLog[];
        logs?: AuditLog[];
        total?: number;
      }>(ENDPOINTS.audit.logs, { params });

      const raw = normalizeList<Record<string, unknown>>(res, ['logs']);
      const list: AuditLog[] = raw.map((row) => {
        const actor = row.actor;
        const actorObject = actor && typeof actor === 'object'
          ? actor as Record<string, unknown>
          : undefined;
        const actorId = typeof actor === 'string' ? actor : undefined;
        const resource = typeof row.resource === 'string' ? row.resource : '';
        const resourceId = typeof row.resourceId === 'string' ? row.resourceId : undefined;
        const metadata = row.metadata && typeof row.metadata === 'object'
          ? row.metadata as Record<string, unknown>
          : undefined;

        return {
          id: String(row._id ?? row.id ?? resourceId ?? `${resource}-${row.createdAt ?? Date.now()}`),
          timestamp: String(row.createdAt ?? row.timestamp ?? new Date().toISOString()),
          actor: actorId ?? String(actorObject?.name ?? actorObject?.email ?? 'System'),
          actorName: typeof actorObject?.name === 'string' ? actorObject.name : undefined,
          actorEmail: typeof actorObject?.email === 'string' ? actorObject.email : undefined,
          role: typeof actorObject?.role === 'string' ? actorObject.role : String(row.role ?? ''),
          action: String(row.action ?? ''),
          target: resource,
          entity: resource,
          entityId: resourceId,
          ipAddress: String(row.ip ?? row.ipAddress ?? '—'),
          status: row.status === 'WARNING' || row.status === 'FAILED' ? row.status : 'SUCCESS',
          details: typeof row.details === 'string' ? row.details : undefined,
          description: typeof metadata?.description === 'string'
            ? metadata.description
            : undefined,
        };
      });
      return {
        logs: list,
        total: normalizeTotal(res, list.length),
      };
    },
    staleTime: 15_000,
  });
}
