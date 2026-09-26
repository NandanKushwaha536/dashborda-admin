'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { AdminUser } from '@/lib/api/types';

// The backend sends avatar as { url, publicId } | null — never a bare
// string — so it has to be unwrapped the same way AuthContext does.
function extractAvatarUrl(raw: unknown): string | null {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    const url = (raw as Record<string, unknown>).url;
    if (typeof url === 'string') return url;
  }
  return null;
}

function normalizeProfile(raw: unknown): AdminUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  let candidate: Record<string, unknown> = obj;
  if (obj.data && typeof obj.data === 'object') {
    candidate = obj.data as Record<string, unknown>;
  }
  if (candidate.user && typeof candidate.user === 'object') {
    candidate = candidate.user as Record<string, unknown>;
  }

  const id = typeof candidate.id === 'string' ? candidate.id : typeof candidate._id === 'string' ? candidate._id : '';
  const email = typeof candidate.email === 'string' ? candidate.email : '';
  if (!id && !email) return null;

  const rawRole = typeof candidate.role === 'string' ? candidate.role.toUpperCase() : 'VIEWER';
  const role = (['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'VIEWER', 'SUPPORT'].includes(rawRole)
    ? rawRole
    : 'VIEWER') as AdminUser['role'];

  const rawStatus = typeof candidate.status === 'string' ? candidate.status.toUpperCase() : 'ACTIVE';
  const status = (['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(rawStatus) ? rawStatus : 'ACTIVE') as AdminUser['status'];

  return {
    id: id || email,
    name: typeof candidate.name === 'string' ? candidate.name : email.split('@')[0] || 'Admin User',
    email,
    phone: typeof candidate.phone === 'string' ? candidate.phone : undefined,
    role,
    status,
    avatar: extractAvatarUrl(candidate.avatar),
    isEmailVerified: typeof candidate.isEmailVerified === 'boolean' ? candidate.isEmailVerified : undefined,
    lastLogin: typeof candidate.lastLogin === 'string' ? candidate.lastLogin : undefined,
    permissions: Array.isArray(candidate.permissions)
      ? candidate.permissions.filter((p): p is string => typeof p === 'string')
      : [],
  };
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.profile.get);
      const profile = normalizeProfile(res);
      if (!profile) throw new Error('Invalid profile response from backend.');
      return profile;
    },
    staleTime: 30_000,
  });
}

// Backend only persists `name` today even though the update route accepts
// email/phone in its body — see user.service.ts updateProfile(). Email and
// phone changes go through the separate OTP-verified auth endpoints
// (/auth/change-email, /auth/change-phone), not this route.
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await api.patch<unknown>(ENDPOINTS.profile.update, data);
      const profile = normalizeProfile(res);
      if (!profile) throw new Error('Invalid profile response from backend.');
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      // Field name must be "avatar" — matches upload.single("avatar") on
      // the backend route.
      formData.append('avatar', file);
      const res = await api.post<unknown>(ENDPOINTS.profile.uploadAvatar, formData);
      const profile = normalizeProfile(res);
      if (!profile) throw new Error('Invalid profile response from backend.');
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return api.delete<{ success: boolean }>(ENDPOINTS.profile.deleteAvatar);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) =>
      api.patch<{ success: boolean }>(ENDPOINTS.profile.changePassword, data),
  });
}
