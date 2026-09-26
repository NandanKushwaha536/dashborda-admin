'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { InventoryItem, InventoryReservation } from '@/lib/api/types';
import { normalizeList, normalizeTotal, normalizePage, normalizeLimit } from '@/lib/api/normalize';

export interface InventoryFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export function useInventoryOverview(params: InventoryFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.inventory.overview(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: InventoryItem[];
        items?: InventoryItem[];
        total?: number;
        page?: number;
        limit?: number;
        summary?: {
          totalStock: number;
          availableStock: number;
          reservedStock: number;
          lowStockCount: number;
        };
      }>(ENDPOINTS.inventory.overview, {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          status: params.status || undefined,
          search: params.search || undefined,
        },
      });

      const raw = normalizeList<Record<string, unknown>>(res, ['items']);
      const list: InventoryItem[] = raw.map((row) => {
        const stock = Number(row.stock ?? row.available ?? 0);
        const rawStatus = String(row.inventoryStatus ?? row.status ?? 'IN_STOCK');
        const status: InventoryItem['status'] = rawStatus === 'OUT_OF_STOCK'
          ? 'OUT_OF_STOCK'
          : rawStatus === 'LOW_STOCK'
            ? 'LOW_STOCK'
            : 'IN_STOCK';
        return {
          _id: String(row._id ?? row.id ?? ''),
          productId: String(row._id ?? row.productId ?? row.id ?? ''),
          productName: String(row.name ?? row.productName ?? ''),
          sku: String(row.sku ?? ''),
          available: stock,
          totalStock: stock,
          status,
          reserved: typeof row.reserved === 'number' ? row.reserved : undefined,
          damaged: typeof row.damaged === 'number' ? row.damaged : undefined,
          incoming: typeof row.incoming === 'number' ? row.incoming : undefined,
          reorderPoint: typeof row.reorderPoint === 'number' ? row.reorderPoint : undefined,
          warehouse: typeof row.warehouse === 'string' ? row.warehouse : undefined,
          variant: typeof row.variant === 'string' ? row.variant : undefined,
          lastRestocked: typeof row.lastRestocked === 'string' ? row.lastRestocked : undefined,
        };
      });
      return {
        items: list,
        total: normalizeTotal(res, list.length),
        page: normalizePage(res, params.page ?? 1),
        limit: normalizeLimit(res, params.limit ?? 20),
        summary: res.summary,
      };
    },
    staleTime: 15_000,
  });
}

export function useInventoryReservations() {
  return useQuery({
    queryKey: queryKeys.inventory.reservations,
    queryFn: async () => {
      const res = await api.get<{ success?: boolean; data?: InventoryReservation[] }>(
        ENDPOINTS.inventory.reservations
      );
      return normalizeList<InventoryReservation>(res, ['reservations']);
    },
    staleTime: 10_000,
  });
}

// Backend route is PATCH /admin/inventory/:productId/adjust and accepts
// EITHER a signed `quantity` delta OR an absolute `physicalCount` — never a
// `sku` or `type` field, and never POST. ENDPOINTS.inventory.adjust is a
// function of productId, not a static path.
export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      productId: string;
      quantity?: number;
      physicalCount?: number;
      warehouseId?: string;
      reason: string;
    }) => {
      const { productId, ...body } = payload;
      return api.patch<{ success: boolean; data: InventoryItem }>(
        ENDPOINTS.inventory.adjust(productId),
        body
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
