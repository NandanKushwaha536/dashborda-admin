'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth/AuthContext';

/** Change the signed-in staff member's display name, then refresh the session user. */
export function useUpdateProfile() {
  const { refreshUser } = useAuth();
  return useMutation({
    mutationFn: (input: { name: string }) => api.patch<unknown>(ENDPOINTS.profile.update, { name: input.name.trim() }),
    onSuccess: () => refreshUser(),
  });
}

/** Upload a new profile photo (JPG, PNG or WEBP, up to 2 MB), then refresh the session user. */
export function useUploadAvatar() {
  const { refreshUser } = useAuth();
  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append('avatar', file);
      return api.post<unknown>(ENDPOINTS.profile.avatar, body);
    },
    onSuccess: () => refreshUser(),
  });
}

/** Remove the profile photo; initials show instead. */
export function useRemoveAvatar() {
  const { refreshUser } = useAuth();
  return useMutation({
    mutationFn: () => api.delete<unknown>(ENDPOINTS.profile.avatar),
    onSuccess: () => refreshUser(),
  });
}

/** PATCH /auth/change-password — both passwords 8 to 32 characters. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) => api.patch<unknown>(ENDPOINTS.auth.changePassword, input),
  });
}
