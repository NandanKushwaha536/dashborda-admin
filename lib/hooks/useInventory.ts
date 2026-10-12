'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList, normalizeTotal } from '@/lib/api/normalize';
import type { InventoryItem } from '@/lib/api/types';
import { getStepUpToken, stepUpHeaders } from './useStepUp';

export interface InventoryFilters {
  page: number;
  limit: number;
  /** Show only products with stock at or below this number (0 = out of stock). */
  threshold?: number;
  search?: string;
  enabled?: boolean;
}

export function useInventory(filters: InventoryFilters) {
  const params = { page: filters.page, limit: filters.limit, threshold: filters.threshold, search: filters.search?.trim() || undefined };
  return useQuery({
    queryKey: queryKeys.inventory.list(params),
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.inventory.overview, { params });
      const items = normalizeList<Record<string, unknown>>(res, ['items']).map((row): InventoryItem => {
        const stock = Number(row.stock ?? row.available ?? 0);
        const status = String(row.inventoryStatus ?? row.status ?? 'IN_STOCK');
        return {
          _id: String(row._id ?? row.id ?? ''),
          productId: String(row._id ?? row.productId ?? ''),
          productName: String(row.name ?? row.productName ?? ''),
          sku: String(row.sku ?? ''),
          available: stock,
          reserved: typeof row.reserved === 'number' ? row.reserved : undefined,
          reorderPoint: typeof row.reorderPoint === 'number' ? row.reorderPoint : undefined,
          status: status === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : status === 'LOW_STOCK' ? 'LOW_STOCK' : 'IN_STOCK',
        };
      });
      return { items, total: normalizeTotal(res, items.length) };
    },
    placeholderData: (previous) => previous,
    enabled: filters.enabled ?? true,
    staleTime: 15_000,
  });
}

/**
 * PATCH /admin/inventory/:productId/adjust takes either a signed `quantity`
 * change (+10 received, −2 damaged) or an absolute `physicalCount` after a count.
 * The backend asks for the admin's password again (step-up) for stock changes.
 */
export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, password, ...body }: { productId: string; password: string; quantity?: number; physicalCount?: number; reason: string }) => {
      const token = await getStepUpToken(password);
      return api.patch<unknown>(ENDPOINTS.inventory.adjust(productId), body, { headers: stepUpHeaders(token) });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
