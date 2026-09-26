'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { Customer } from '@/lib/api/types';
import { normalizeList, normalizeTotal, normalizePage, normalizeLimit } from '@/lib/api/normalize';

export interface CustomerFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  status?: string;
}

export function useCustomers(params: CustomerFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.customers.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: Customer[];
        customers?: Customer[];
        total?: number;
        page?: number;
        limit?: number;
      }>(ENDPOINTS.customers.list, {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          search: params.search || undefined,
          tier: params.tier || undefined,
          status: params.status || undefined,
        },
      });

      const raw = normalizeList<Record<string, unknown>>(res, ['customers']);
      const list: Customer[] = raw.map((row) => ({
        id: String(row._id ?? row.id ?? ''),
        name: String(row.name ?? row.fullName ?? 'Customer'),
        email: String(row.email ?? ''),
        phone: String(row.phone ?? '—'),
        city: typeof row.city === 'string' ? row.city : undefined,
        state: typeof row.state === 'string' ? row.state : undefined,
        ordersCount: Number(row.ordersCount ?? row.orderCount ?? 0),
        totalSpent: Number(row.totalSpent ?? row.totalOrdersValue ?? row.totalSpentAmount ?? 0),
        tier: (row.tier === 'Silver' || row.tier === 'Gold' || row.tier === 'VIP' ? row.tier : 'Standard') as Customer['tier'],
        status: (row.status === 'BLOCKED' || row.status === 'DELETED' ? row.status : 'ACTIVE') as Customer['status'],
        createdAt: String(row.createdAt ?? new Date().toISOString()),
      }));
      return {
        customers: list,
        total: normalizeTotal(res, list.length),
        page: normalizePage(res, params.page ?? 1),
        limit: normalizeLimit(res, params.limit ?? 20),
      };
    },
    staleTime: 30_000,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: async () => {
      const res = await api.get<{ success?: boolean; data?: Customer; customer?: Customer }>(
        ENDPOINTS.customers.detail(id)
      );
      return res.data || res.customer || (res as unknown as Customer);
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

// ENDPOINTS.customers.updateStatus never existed (endpoints.ts only defines
// `update`), and the backend's status enum is ACTIVE | BLOCKED | DELETED —
// not 'SUSPENDED'. The real route is PATCH /admin/customers/:id.
export function useUpdateCustomerStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'BLOCKED' | 'DELETED' }) => {
      return api.patch<{ success: boolean; data: Customer }>(
        ENDPOINTS.customers.update(id),
        { status }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}
