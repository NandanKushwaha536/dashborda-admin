'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList } from '@/lib/api/normalize';

export interface ReviewItem {
  id: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export function useReviews() {
  return useQuery({
    queryKey: queryKeys.reviews.all,
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: ReviewItem[];
        reviews?: ReviewItem[];
      }>(ENDPOINTS.reviews.list);
      return normalizeList<ReviewItem>(res, ['reviews']);
    },
    staleTime: 30_000,
  });
}

export function useUpdateReviewStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    // Backend mounts this route as router.patch('/:id/status', ...), not PUT.
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      api.patch(ENDPOINTS.reviews.updateStatus(id), { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });
}
