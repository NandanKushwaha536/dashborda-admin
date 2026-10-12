'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList, normalizeTotal } from '@/lib/api/normalize';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  /** Customer photos (https only). */
  images: string[];
  isVerifiedPurchase: boolean;
}

type Raw = Record<string, unknown>;
const obj = (value: unknown): Raw => (value && typeof value === 'object' ? (value as Raw) : {});

function normalizeReview(row: Raw): Review {
  const product = obj(row.product);
  const user = obj(row.user);
  const status = String(row.status ?? 'PENDING');
  return {
    id: String(row._id ?? row.id ?? ''),
    productId: String(product._id ?? row.product ?? ''),
    productName: String(product.name ?? 'Product'),
    productSku: String(product.sku ?? ''),
    customerName: String(user.name ?? 'Customer'),
    rating: Number(row.rating ?? 0),
    title: typeof row.title === 'string' ? row.title : '',
    comment: typeof row.comment === 'string' ? row.comment : '',
    status: (status === 'APPROVED' || status === 'REJECTED' ? status : 'PENDING') as ReviewStatus,
    createdAt: String(row.createdAt ?? ''),
    images: Array.isArray(row.images) ? row.images.filter((url): url is string => typeof url === 'string' && url.startsWith('https://')) : [],
    isVerifiedPurchase: Boolean(row.isVerifiedPurchase),
  };
}

export function useReviews(params: { status: ReviewStatus | ''; page: number; limit: number }) {
  const query = { status: params.status || undefined, page: params.page, limit: params.limit };
  return useQuery({
    queryKey: [...queryKeys.reviews, query],
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.reviews.list, { params: query });
      const reviews = normalizeList<Raw>(res, ['reviews']).map(normalizeReview).filter((r) => r.id);
      return { reviews, total: normalizeTotal(res, reviews.length) };
    },
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

/** Publish or reject a review. Only approved reviews appear on the store. */
export function useSetReviewStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) => api.patch<unknown>(ENDPOINTS.reviews.updateStatus(id), { status }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.reviews }),
  });
}
