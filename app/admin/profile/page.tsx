'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
  useDeleteAvatar,
  useChangePassword,
} from '@/lib/hooks/useProfile';
import { useAuth } from '@/lib/auth/useAuth';
import { ApiError } from '@/lib/api/client';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { Camera, Trash2, Check, KeyRound, User as UserIcon } from 'lucide-react';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // Matches the backend's multer limit.

export default function ProfilePage() {
  const { data: profile, isLoading, error, refetch } = useProfile();
  const { refreshUser } = useAuth();

  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();
  const changePasswordMutation = useChangePassword();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [showRemoveAvatarConfirm, setShowRemoveAvatarConfirm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (profile) setName(profile.name);
  }, [profile]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 3) return;
    await updateProfileMutation.mutateAsync({ name: name.trim() });
    await refreshUser(); // Keep the sidebar / header in sync immediately.
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // Allow re-selecting the same file later.
    if (!file) return;

    setAvatarError('');
    if (!file.type.startsWith('image/')) {
      setAvatarError('Only image files are allowed.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Image must be 2MB or smaller.');
      return;
    }

    try {
      await uploadAvatarMutation.mutateAsync(file);
      await refreshUser();
    } catch (err: unknown) {
      setAvatarError(err instanceof ApiError ? err.message : 'Failed to upload avatar.');
    }
  };

  const handleRemoveAvatar = async () => {
    setShowRemoveAvatarConfirm(false);
    try {
      await deleteAvatarMutation.mutateAsync();
      await refreshUser();
    } catch (err: unknown) {
      setAvatarError(err instanceof ApiError ? err.message : 'Failed to remove avatar.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (currentPassword.length < 8) {
      setPasswordError('Enter your current password (min. 8 characters).');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2500);
    } catch (err: unknown) {
      setPasswordError(err instanceof ApiError ? err.message : 'Failed to change password.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="My Profile" description="Manage your account details and security." />
        <AdminTableSkeleton rows={4} columns={2} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="My Profile" description="Manage your account details and security." />
        <AdminErrorState
          title="Failed to load your profile"
          message="Could not connect to the backend profile endpoint."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <AdminPageHeader title="My Profile" description="Manage your account details and security." />

      {/* Avatar + identity summary */}
      <AdminCard>
        <AdminCardBody className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-slate-700 border border-slate-200 flex items-center justify-center text-xl font-semibold text-white overflow-hidden">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <button
              type="button"
              onClick={handleAvatarPick}
              disabled={uploadAvatarMutation.isPending}
              title="Change avatar"
              className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5">
              <h2 className="text-lg font-semibold text-slate-900">{profile.name}</h2>
              <AdminStatusBadge status={profile.role} size="sm" />
            </div>
            <p className="text-sm text-slate-500">{profile.email}</p>
            {profile.phone && <p className="text-xs text-slate-400">{profile.phone}</p>}
            {profile.lastLogin && (
              <p className="text-[11px] text-slate-400">
                Last login: {new Date(profile.lastLogin).toLocaleString()}
              </p>
            )}

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1.5 flex-wrap">
              <AdminButton
                variant="outline"
                size="sm"
                leftIcon={<Camera className="w-3.5 h-3.5" />}
                onClick={handleAvatarPick}
                isLoading={uploadAvatarMutation.isPending}
              >
                Upload photo
              </AdminButton>
              {profile.avatar && (
                <AdminButton
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                  onClick={() => setShowRemoveAvatarConfirm(true)}
                  isLoading={deleteAvatarMutation.isPending}
                >
                  Remove
                </AdminButton>
              )}
            </div>
            {avatarError && <p className="text-xs text-red-600 pt-1">{avatarError}</p>}
            <p className="text-[11px] text-slate-400">JPG or PNG, up to 2MB.</p>
          </div>
        </AdminCardBody>
      </AdminCard>

      {/* Editable name + read-only contact details */}
      <AdminCard>
        <AdminCardHeader
          title="Account Details"
          subtitle="Your display name is visible to other admins across the dashboard."
        />
        <AdminCardBody>
          <form onSubmit={handleSaveName} className="space-y-4">
            <AdminInput
              label="Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              leftIcon={<UserIcon className="w-3.5 h-3.5" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AdminInput
                label="Email Address"
                value={profile.email}
                disabled
                helperText="Changing your email requires OTP verification — contact a Super Admin."
              />
              <AdminInput
                label="Phone Number"
                value={profile.phone || 'Not set'}
                disabled
                helperText="Changing your phone requires OTP verification — contact a Super Admin."
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <AdminButton
                type="submit"
                variant="primary"
                size="sm"
                isLoading={updateProfileMutation.isPending}
                disabled={!name.trim() || name.trim().length < 3 || name.trim() === profile.name}
              >
                Save Changes
              </AdminButton>
              {nameSaved && (
                <span className="text-xs text-teal-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>
          </form>
        </AdminCardBody>
      </AdminCard>

      {/* Change password */}
      <AdminCard>
        <AdminCardHeader title="Change Password" subtitle="Use a strong password you don't reuse elsewhere." />
        <AdminCardBody>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <AdminInput
              label="Current Password *"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<KeyRound className="w-3.5 h-3.5" />}
              autoComplete="current-password"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AdminInput
                label="New Password *"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
              <AdminInput
                label="Confirm New Password *"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>

            {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}

            <div className="flex items-center gap-3 pt-1">
              <AdminButton
                type="submit"
                variant="primary"
                size="sm"
                isLoading={changePasswordMutation.isPending}
              >
                Update Password
              </AdminButton>
              {passwordSaved && (
                <span className="text-xs text-teal-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Password updated
                </span>
              )}
            </div>
          </form>
        </AdminCardBody>
      </AdminCard>

      <AdminConfirmDialog
        isOpen={showRemoveAvatarConfirm}
        onClose={() => setShowRemoveAvatarConfirm(false)}
        onConfirm={handleRemoveAvatar}
        title="Remove Profile Photo"
        message="Your avatar will be removed and your initials will be shown instead."
        confirmLabel="Remove"
        isDangerous
        isLoading={deleteAvatarMutation.isPending}
      />
    </div>
  );
}
