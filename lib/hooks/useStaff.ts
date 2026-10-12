'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList } from '@/lib/api/normalize';
import type { AdminRole } from '@/lib/auth/permissions';
import { getStepUpToken, stepUpHeaders } from './useStepUp';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  lastLogin?: string;
  createdAt: string;
}

type Raw = Record<string, unknown>;

export function useStaff() {
  return useQuery({
    queryKey: queryKeys.staff,
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.staff.list, { params: { limit: 100 } });
      return normalizeList<Raw>(res, ['users']).map(
        (row): StaffMember => ({
          id: String(row._id ?? row.id ?? ''),
          name: String(row.name ?? ''),
          email: String(row.email ?? ''),
          phone: String(row.phone ?? ''),
          role: String(row.role ?? ''),
          status: (row.status === 'BLOCKED' || row.status === 'DELETED' ? row.status : 'ACTIVE') as StaffMember['status'],
          lastLogin: typeof row.lastLogin === 'string' ? row.lastLogin : undefined,
          createdAt: String(row.createdAt ?? ''),
        })
      );
    },
    staleTime: 30_000,
  });
}

/** Creating and changing staff needs the owner's password again (backend step-up). */
export function useStaffMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.staff });
  return {
    create: useMutation({
      mutationFn: async ({ ownerPassword, ...input }: { ownerPassword: string; name: string; email: string; phone?: string; password: string; role: AdminRole }) => {
        const token = await getStepUpToken(ownerPassword);
        return api.post<unknown>(
          ENDPOINTS.staff.create,
          { name: input.name.trim(), email: input.email.trim().toLowerCase(), ...(input.phone?.trim() ? { phone: input.phone.trim() } : {}), password: input.password, role: input.role, permissions: [] },
          { headers: stepUpHeaders(token) }
        );
      },
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: async ({ id, ownerPassword, ...body }: { id: string; ownerPassword: string; role?: AdminRole; status?: 'ACTIVE' | 'BLOCKED' }) => {
        const token = await getStepUpToken(ownerPassword);
        return api.patch<unknown>(ENDPOINTS.staff.update(id), body, { headers: stepUpHeaders(token) });
      },
      onSuccess: invalidate,
    }),
  };
}
