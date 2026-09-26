'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { RolePermission, AdminNotification } from '@/lib/api/types';
import { normalizeList } from '@/lib/api/normalize';

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.roles.all,
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: RolePermission[];
        roles?: RolePermission[];
      }>(ENDPOINTS.roles.list);
      return normalizeList<RolePermission>(res, ['roles']);
    },
    staleTime: 60_000,
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      api.patch(ENDPOINTS.roles.update(id), { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: AdminNotification[];
        notifications?: AdminNotification[];
      }>(ENDPOINTS.notifications.list);
      return normalizeList<AdminNotification>(res, ['notifications']);
    },
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(ENDPOINTS.notifications.markRead(id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(ENDPOINTS.notifications.markAllRead, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
