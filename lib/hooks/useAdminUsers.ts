'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList } from '@/lib/api/normalize';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SUPPORT';
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: StaffUser[];
        users?: StaffUser[];
      }>(ENDPOINTS.users.list);
      return normalizeList<StaffUser>(res, ['users']);
    },
    staleTime: 30_000,
  });
}

export function useInviteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userData: { name: string; email: string; role: StaffUser['role'] }) =>
      api.post<StaffUser>(ENDPOINTS.users.invite, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

// ENDPOINTS.users.updateRole never existed (only `update` is defined), and
// the backend mounts this route as router.patch('/users/:id', ...), not PUT.
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: StaffUser['role'] }) =>
      api.patch(ENDPOINTS.users.update(id), { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
