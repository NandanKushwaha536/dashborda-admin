'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList, normalizeTotal } from '@/lib/api/normalize';
import type { OrderStatus, PaymentStatus } from '@/lib/api/types';

export type CustomerStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED';

export interface Customer {
  id: string;
  name: string;
  /** Masked by the backend (privacy), e.g. ra***@gmail.com */
  email: string;
  phone: string;
  status: CustomerStatus;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
  lastLogin?: string;
}

export interface CustomerDetail extends Customer {
  adminNotes: string;
  tags: string[];
  orders: Array<{ id: string; orderNumber: string; status: OrderStatus; paymentStatus: PaymentStatus; total: number; createdAt: string; items: number }>;
}

type Raw = Record<string, unknown>;

function normalizeCustomer(row: Raw): Customer {
  const status = String(row.status ?? 'ACTIVE');
  return {
    id: String(row._id ?? row.id ?? ''),
    name: String(row.name ?? 'Customer'),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    status: (status === 'BLOCKED' || status === 'DELETED' ? status : 'ACTIVE') as CustomerStatus,
    ordersCount: Number(row.ordersCount ?? 0),
    totalSpent: Number(row.totalSpent ?? 0),
    createdAt: String(row.createdAt ?? ''),
    lastLogin: typeof row.lastLogin === 'string' ? row.lastLogin : undefined,
  };
}

export function useCustomers(params: { page: number; limit: number; search?: string; status?: string }) {
  const query = { page: params.page, limit: params.limit, search: params.search?.trim() || undefined, status: params.status || undefined };
  return useQuery({
    queryKey: queryKeys.customers.list(query),
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.customers.list, { params: query });
      const customers = normalizeList<Raw>(res, ['customers']).map(normalizeCustomer);
      return { customers, total: normalizeTotal(res, customers.length) };
    },
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: async (): Promise<CustomerDetail> => {
      const res = await api.get<{ data?: { customer?: Raw; orders?: Raw[]; stats?: { orders?: number; totalSpent?: number } } }>(ENDPOINTS.customers.detail(id));
      const data = res.data ?? {};
      const customer = data.customer ?? {};
      const base = normalizeCustomer(customer);
      return {
        ...base,
        ordersCount: Number(data.stats?.orders ?? base.ordersCount),
        totalSpent: Number(data.stats?.totalSpent ?? base.totalSpent),
        adminNotes: typeof customer.adminNotes === 'string' ? customer.adminNotes : '',
        tags: Array.isArray(customer.tags) ? customer.tags.filter((t): t is string => typeof t === 'string') : [],
        orders: (data.orders ?? []).map((order) => ({
          id: String(order._id ?? ''),
          orderNumber: String(order.orderNumber ?? ''),
          status: String(order.orderStatus ?? 'PENDING') as OrderStatus,
          paymentStatus: String(order.paymentStatus ?? 'PENDING') as PaymentStatus,
          total: Number(order.total ?? 0),
          createdAt: String(order.createdAt ?? ''),
          items: Array.isArray(order.items) ? order.items.length : 0,
        })),
      };
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

/** Block / unblock, staff notes and tags (PATCH /admin/customers/:id). */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: CustomerStatus; adminNotes?: string; tags?: string[] }) =>
      api.patch<unknown>(ENDPOINTS.customers.update(id), body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.id) });
    },
  });
}
