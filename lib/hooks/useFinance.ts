'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { FinanceSummary, Transaction, Refund } from '@/lib/api/types';
import { normalizeList, normalizeTotal } from '@/lib/api/normalize';

export function useFinanceSummary(period: string = '30d') {
  return useQuery({
    queryKey: queryKeys.finance.summary(period),
    queryFn: async () => {
      const res = await api.get<{ success?: boolean; data?: FinanceSummary }>(
        ENDPOINTS.finance.summary,
        { params: { period } }
      );
      return res.data || (res as unknown as FinanceSummary);
    },
    staleTime: 60_000,
  });
}

export function useTransactions(params: { page?: number; limit?: number; type?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.finance.transactions(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: Transaction[];
        transactions?: Transaction[];
        total?: number;
      }>(ENDPOINTS.finance.transactions, { params });
      return {
        transactions: normalizeList<Transaction>(res, ['transactions']),
        total: normalizeTotal(res, 0),
      };
    },
    staleTime: 30_000,
  });
}

export function useRefunds(params: { page?: number; limit?: number; status?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.finance.refunds(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: Refund[];
        refunds?: Refund[];
        total?: number;
      }>(ENDPOINTS.finance.refunds, { params });
      return {
        refunds: normalizeList<Refund>(res, ['refunds']),
        total: normalizeTotal(res, 0),
      };
    },
    staleTime: 30_000,
  });
}

export function useApproveReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/returns/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.refunds() });
    },
  });
}

export function useRejectReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.post(`/returns/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.refunds() });
    },
  });
}

export function useProcessReturnRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, notes }: { id: string; amount?: number; notes?: string }) =>
      api.post(`/returns/${id}/refund`, { amount, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.refunds() });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.summary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.transactions() });
    },
  });
}
