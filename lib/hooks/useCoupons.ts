'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList } from '@/lib/api/normalize';

export type CouponType = 'PERCENTAGE' | 'FIXED';
export type CouponStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

/** Shape of a coupon as the backend stores it (models/Coupon.ts). */
export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  startDate: string;
  endDate: string;
  status: CouponStatus;
  showOnStore: boolean;
}

export interface CouponInput {
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  showOnStore: boolean;
}

type Raw = Record<string, unknown>;
const optionalNumber = (value: unknown) => (value === null || value === undefined || value === '' ? undefined : Number(value));

function normalizeCoupon(row: Raw): Coupon {
  const endDate = String(row.endDate ?? '');
  const rawStatus = String(row.status ?? 'ACTIVE');
  // A coupon past its end date is expired even if the nightly job hasn't flagged it yet.
  const expired = endDate && new Date(endDate).getTime() < Date.now();
  return {
    id: String(row._id ?? row.id ?? ''),
    code: String(row.code ?? ''),
    description: typeof row.description === 'string' ? row.description : '',
    type: row.type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
    value: Number(row.value ?? 0),
    minOrderAmount: Number(row.minOrderAmount ?? 0),
    maxDiscountAmount: optionalNumber(row.maxDiscountAmount),
    usageLimit: optionalNumber(row.usageLimit),
    usedCount: Number(row.usedCount ?? 0),
    perUserLimit: optionalNumber(row.perUserLimit),
    startDate: String(row.startDate ?? ''),
    endDate,
    status: (expired ? 'EXPIRED' : rawStatus === 'INACTIVE' || rawStatus === 'EXPIRED' ? rawStatus : 'ACTIVE') as CouponStatus,
    showOnStore: row.showOnStore !== false,
  };
}

export function useCoupons() {
  return useQuery({
    queryKey: queryKeys.coupons,
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.coupons.list);
      return normalizeList<Raw>(res, ['coupons']).map(normalizeCoupon).filter((c) => c.id);
    },
    staleTime: 30_000,
  });
}

function toBody(input: CouponInput, forUpdate = false) {
  // On edit, an emptied limit is sent as null so the backend clears it.
  const cleared = forUpdate ? null : undefined;
  return {
    code: input.code.trim().toUpperCase(),
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    type: input.type,
    value: input.value,
    minOrderAmount: input.minOrderAmount ?? 0,
    maxDiscountAmount: input.type === 'PERCENTAGE' && input.maxDiscountAmount ? input.maxDiscountAmount : cleared,
    usageLimit: input.usageLimit ? input.usageLimit : cleared,
    perUserLimit: input.perUserLimit ? input.perUserLimit : cleared,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
    showOnStore: input.showOnStore,
  };
}

export function useCouponMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.coupons });
  return {
    create: useMutation({ mutationFn: (input: CouponInput) => api.post<unknown>(ENDPOINTS.coupons.create, toBody(input)), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: CouponInput }) => api.put<unknown>(ENDPOINTS.coupons.update(id), toBody(input, true)), onSuccess: invalidate }),
    deactivate: useMutation({ mutationFn: (id: string) => api.patch<unknown>(ENDPOINTS.coupons.deactivate(id)), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => api.delete<unknown>(ENDPOINTS.coupons.delete(id)), onSuccess: invalidate }),
  };
}
