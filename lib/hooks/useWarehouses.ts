import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Warehouse } from '@/lib/api/types';

export interface CreateWarehouseInput {
  name: string;
  code: string;
  type: Warehouse['type'];
  contactPerson?: string;
  phone?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  status: Warehouse['status'];
  isDefault: boolean;
  pickupEnabled: boolean;
  notes?: string;
}

export type UpdateWarehouseInput = Partial<CreateWarehouseInput>;

export function useWarehouses() {
  return useQuery<{
    warehouses: Warehouse[];
    isBackendMounted: boolean;
  }>({
    queryKey: ['admin', 'warehouses'],
    queryFn: async () => {
      try {
        const res = await api.get<{ success?: boolean; data?: Warehouse[]; warehouses?: Warehouse[] }>(
          ENDPOINTS.warehouses.list
        );

        let list: Warehouse[] = [];
        if (Array.isArray(res.data)) {
          list = res.data;
        } else if (Array.isArray(res.warehouses)) {
          list = res.warehouses;
        } else if (Array.isArray(res)) {
          list = res;
        }

        return {
          warehouses: list,
          isBackendMounted: true,
        };
      } catch {
        // Backend endpoint not mounted or returned error
        return {
          warehouses: [],
          isBackendMounted: false,
        };
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateWarehouseInput) => {
      return await api.post<Warehouse>(ENDPOINTS.warehouses.create, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouses'] });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWarehouseInput }) => {
      return await api.put<Warehouse>(ENDPOINTS.warehouses.update(id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouses'] });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(ENDPOINTS.warehouses.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouses'] });
    },
  });
}
