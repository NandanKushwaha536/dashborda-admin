'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { normalizeList } from '@/lib/api/normalize';

export interface CampaignItem {
  id: string;
  _id?: string;
  name: string;
  code: string;
  type: 'SEASONAL' | 'HOLIDAY' | 'EMAIL_MARKETING' | 'FLASH_EVENT' | 'CLEARANCE';
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  description?: string;
  discountPercentage?: number;
  bannerUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCampaignInput {
  name: string;
  code: string;
  type: CampaignItem['type'];
  startDate: string;
  endDate: string;
  status: CampaignItem['status'];
  description?: string;
  discountPercentage?: number;
}

export type UpdateCampaignInput = Partial<CreateCampaignInput>;

export function useCampaigns(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'campaigns', params],
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: CampaignItem[];
        campaigns?: CampaignItem[];
      }>(ENDPOINTS.campaigns.list, { params });
      return normalizeList<CampaignItem>(res, ['campaigns']);
    },
    staleTime: 30_000,
  });
}

export function useCampaign(id?: string) {
  return useQuery({
    queryKey: ['admin', 'campaigns', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<{ success?: boolean; data?: CampaignItem }>(
        ENDPOINTS.campaigns.detail(id)
      );
      return (res.data || res) as CampaignItem;
    },
    enabled: Boolean(id),
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampaignInput) => api.post<CampaignItem>(ENDPOINTS.campaigns.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    // Backend Campaign route uses PATCH /:id
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignInput }) =>
      api.patch<CampaignItem>(ENDPOINTS.campaigns.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.campaigns.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
    },
  });
}
