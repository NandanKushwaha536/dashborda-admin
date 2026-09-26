'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  currency: string;
  taxRate: number;
  lowStockThreshold: number;
  autoConfirmOrders: boolean;
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.current,
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: StoreSettings;
        settings?: StoreSettings;
      }>(ENDPOINTS.settings.get);
      const raw = res.data || res.settings;
      if (!raw) return null;
      return {
        storeName: String(raw.storeName ?? 'RGEnterprises Store'),
        supportEmail: String(raw.supportEmail ?? 'support@rgenterprises.com'),
        currency: String(raw.currency ?? 'INR'),
        taxRate: Number(raw.taxRate ?? 18),
        lowStockThreshold: Number(raw.lowStockThreshold ?? 5),
        autoConfirmOrders: Boolean(raw.autoConfirmOrders ?? false),
      } satisfies StoreSettings;
    },
    staleTime: 60_000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    // Backend mounts this route as router.patch('/', ...), not PUT.
    mutationFn: (newSettings: Partial<StoreSettings>) =>
      api.patch(ENDPOINTS.settings.update, newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.current });
    },
  });
}
