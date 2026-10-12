'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList, normalizeTotal } from '@/lib/api/normalize';
import { getStepUpToken, stepUpHeaders } from './useStepUp';

export type ReturnStatus =
  | 'RETURN_REQUESTED'
  | 'APPROVED'
  | 'PICKUP'
  | 'RECEIVED'
  | 'REFUND_PROCESSING'
  | 'REFUNDED'
  | 'REJECTED'
  | 'CANCELLED';

export interface ReturnRequest {
  id: string;
  status: ReturnStatus;
  reason: string;
  adminNote?: string;
  createdAt: string;
  order: { id: string; orderNumber: string; total: number; paymentStatus: string; paymentMethod?: string };
  customer: { name: string; email: string; phone: string };
  items: Array<{ productId: string; quantity: number; reason?: string }>;
  isReturnable: boolean;
  resolution?: string;
}

type Raw = Record<string, unknown>;
const obj = (value: unknown): Raw => (value && typeof value === 'object' ? (value as Raw) : {});

function normalizeReturn(row: Raw): ReturnRequest {
  const order = obj(row.order);
  const user = obj(row.user);
  const policy = obj(row.policySnapshot);
  return {
    id: String(row._id ?? row.id ?? ''),
    status: String(row.status ?? 'RETURN_REQUESTED') as ReturnStatus,
    reason: String(row.reason ?? ''),
    adminNote: typeof row.adminNote === 'string' ? row.adminNote : undefined,
    createdAt: String(row.createdAt ?? ''),
    order: {
      id: String(order._id ?? row.order ?? ''),
      orderNumber: String(order.orderNumber ?? ''),
      total: Number(order.total ?? 0),
      paymentStatus: String(order.paymentStatus ?? ''),
      paymentMethod: typeof order.paymentMethod === 'string' ? order.paymentMethod : undefined,
    },
    customer: {
      name: String(user.name ?? 'Customer'),
      email: String(user.email ?? ''),
      phone: String(user.phone ?? ''),
    },
    items: (Array.isArray(row.items) ? row.items : []).map((value) => {
      const item = obj(value);
      return { productId: String(obj(item.product)._id ?? item.product ?? ''), quantity: Number(item.quantity ?? 0), reason: typeof item.reason === 'string' ? item.reason : undefined };
    }),
    isReturnable: policy.isReturnable !== false,
    resolution: typeof row.resolution === 'string' ? row.resolution : undefined,
  };
}

export function useReturns(params: { status?: ReturnStatus | ''; page: number; limit: number }) {
  const query = { status: params.status || undefined, page: params.page, limit: params.limit };
  return useQuery({
    queryKey: queryKeys.returns.list(query),
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.returns.list, { params: query });
      const rows = normalizeList<Raw>(res).map(normalizeReturn);
      return { returns: rows, total: normalizeTotal(res, rows.length) };
    },
    placeholderData: (previous) => previous,
    staleTime: 15_000,
  });
}

function useInvalidateReturns() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.returns.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };
}

/** Approve, schedule pickup, mark received, or reject (with a note for the customer). */
export function useUpdateReturnStatus() {
  const invalidate = useInvalidateReturns();
  return useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: 'APPROVED' | 'PICKUP' | 'RECEIVED' | 'REJECTED'; adminNote?: string }) =>
      api.patch<unknown>(ENDPOINTS.returns.status(id), { status, ...(adminNote?.trim() ? { adminNote: adminNote.trim() } : {}) }),
    onSuccess: invalidate,
  });
}

/** Refund a received return to the customer's online payment. Needs the admin's password. */
export function useRefundReturn() {
  const invalidate = useInvalidateReturns();
  return useMutation({
    mutationFn: async ({ id, password, reason }: { id: string; password: string; reason?: string }) => {
      const token = await getStepUpToken(password);
      return api.post<unknown>(ENDPOINTS.returns.refund(id), reason?.trim() ? { reason: reason.trim() } : {}, { headers: stepUpHeaders(token) });
    },
    onSuccess: invalidate,
  });
}
