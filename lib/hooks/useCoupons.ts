'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList } from '@/lib/api/normalize';

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageCount: number;
  usageLimit?: number;
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CouponLifecycleData {
  id: string;
  code: string;
  totalRedemptions: number;
  totalDiscountAmount: number;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    actor?: string;
    reason?: string;
  }>;
}

export function useCoupons(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.coupons.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: Coupon[];
        coupons?: Coupon[];
      }>(ENDPOINTS.coupons.list, { params });
      return normalizeList<Coupon>(res, ['coupons']);
    },
    staleTime: 30_000,
  });
}

export function useSearchCoupons(query: string) {
  return useQuery({
    queryKey: ['coupons', 'search', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const res = await api.get<{ success?: boolean; data?: Coupon[]; coupons?: Coupon[] }>(
        ENDPOINTS.coupons.search,
        { params: { q: query.trim() } }
      );
      return normalizeList<Coupon>(res, ['coupons']);
    },
    enabled: Boolean(query.trim()),
    staleTime: 15_000,
  });
}

export function useCoupon(id?: string) {
  return useQuery({
    queryKey: queryKeys.coupons.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<{ success?: boolean; data?: Coupon }>(ENDPOINTS.coupons.detail(id));
      return (res.data || res) as Coupon;
    },
    enabled: Boolean(id),
  });
}

export function useCouponByCode(code?: string) {
  return useQuery({
    queryKey: ['coupons', 'code', code],
    queryFn: async () => {
      if (!code) return null;
      const res = await api.get<{ success?: boolean; data?: Coupon }>(ENDPOINTS.coupons.byCode(code));
      return (res.data || res) as Coupon;
    },
    enabled: Boolean(code),
  });
}

export function useCouponLifecycle(id?: string) {
  return useQuery({
    queryKey: ['coupons', 'lifecycle', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<{ success?: boolean; data?: CouponLifecycleData }>(
        ENDPOINTS.coupons.lifecycle(id)
      );
      return (res.data || res) as CouponLifecycleData;
    },
    enabled: Boolean(id),
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCoupon: {
      code: string;
      discountType: 'PERCENTAGE' | 'FIXED';
      value: number;
      minOrderAmount: number;
      maxDiscount?: number;
      usageLimit?: number;
      expiresAt?: string;
      status: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
    }) => api.post<Coupon>(ENDPOINTS.coupons.create, newCoupon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Coupon, 'id' | 'usageCount'>>;
    }) => api.put<Coupon>(ENDPOINTS.coupons.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}

export function useDeactivateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<Coupon>(ENDPOINTS.coupons.deactivate(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.coupons.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}
