'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList } from '@/lib/api/normalize';
import type { Warehouse, WarehouseStatus } from '@/lib/api/types';

/** Form values for a pickup location (backend: /admin/operations/warehouses). */
export interface WarehouseInput {
  name: string;
  code: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  status: WarehouseStatus;
}

type Raw = Record<string, unknown>;

function mapWarehouse(raw: Raw): Warehouse {
  const address = raw.address && typeof raw.address === 'object' ? (raw.address as Raw) : {};
  return {
    id: String(raw._id ?? raw.id ?? ''),
    name: String(raw.name ?? ''),
    code: String(raw.code ?? ''),
    addressLine1: String(address.line1 ?? ''),
    addressLine2: typeof address.line2 === 'string' ? address.line2 : undefined,
    city: String(address.city ?? ''),
    state: String(address.state ?? ''),
    country: String(address.country ?? 'India'),
    pincode: String(address.postalCode ?? ''),
    status: raw.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
  };
}

function toBody(input: WarehouseInput) {
  return {
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    address: {
      line1: input.addressLine1.trim(),
      ...(input.addressLine2?.trim() ? { line2: input.addressLine2.trim() } : {}),
      city: input.city.trim(),
      state: input.state.trim(),
      postalCode: input.pincode.trim(),
      country: 'India',
    },
    status: input.status,
  };
}

export function useWarehouses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.warehouses,
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.warehouses.list, { params: { limit: 100 } });
      return { warehouses: normalizeList<Raw>(res, ['warehouses']).map(mapWarehouse).filter((w) => w.id) };
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useWarehouseMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.warehouses });
  return {
    create: useMutation({ mutationFn: (input: WarehouseInput) => api.post<unknown>(ENDPOINTS.warehouses.create, toBody(input)), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: WarehouseInput }) => api.patch<unknown>(ENDPOINTS.warehouses.update(id), toBody(input)),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => api.delete<unknown>(ENDPOINTS.warehouses.remove(id)), onSuccess: invalidate }),
  };
}
