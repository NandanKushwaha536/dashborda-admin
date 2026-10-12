'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { ROLE_LABELS, isAdminRole } from '@/lib/auth/permissions';
import { useChangePassword, useRemoveAvatar, useUpdateProfile, useUploadAvatar } from '@/lib/hooks/useProfile';
import { Avatar } from '@/components/ui/Avatar';
import { errorMessage, formatDateTime } from '@/lib/format';
import { DetailList, PageHeader, Section } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { FormError, Input } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Overlay';

export default function ProfilePage() {
  const toast = useToast();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => setName(user?.name ?? ''), [user?.name]);
  if (!user) return null;

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    if (passwords.next.length < 8 || passwords.next.length > 32) return setPasswordError('The new password must be 8 to 32 characters.');
    if (passwords.next !== passwords.confirm) return setPasswordError('The two new passwords do not match.');
    if (passwords.next === passwords.current) return setPasswordError('Choose a password different from the current one.');
    try {
      await changePassword.mutateAsync({ currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: '', next: '', confirm: '' });
      toast.success('Password changed.');
    } catch (err) {
      setPasswordError(errorMessage(err, 'The password could not be changed.'));
    }
  };

  return (
    <>
      <PageHeader title="My profile" description="Your staff account." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title="Account">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={user.name} src={user.avatar} size="lg" />
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-slate-900">Profile photo</p>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    aria-label="Choose a profile photo"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (!file) return;
                      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
                        return toast.error('Use a JPG, PNG or WEBP photo under 2 MB.');
                      }
                      try {
                        await uploadAvatar.mutateAsync(file);
                        toast.success('Profile photo updated.');
                      } catch (err) {
                        toast.error(errorMessage(err, 'The photo could not be uploaded.'));
                      }
                    }}
                  />
                  <Button size="sm" variant="secondary" icon={<Camera className="h-4 w-4" aria-hidden="true" />} loading={uploadAvatar.isPending} onClick={() => fileInput.current?.click()}>
                    {user.avatar ? 'Change photo' : 'Upload photo'}
                  </Button>
                  {user.avatar ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-700 hover:bg-red-50"
                      icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                      loading={removeAvatar.isPending}
                      onClick={async () => {
                        try {
                          await removeAvatar.mutateAsync();
                          toast.success('Profile photo removed.');
                        } catch (err) {
                          toast.error(errorMessage(err));
                        }
                      }}
                    >
                      Remove photo
                    </Button>
                  ) : null}
                </div>
                <p className="text-[12.5px] text-slate-500">JPG, PNG or WEBP, up to 2 MB.</p>
              </div>
            </div>
            <DetailList
              items={[
                { label: 'Email', value: user.email },
                { label: 'Role', value: isAdminRole(user.role) ? ROLE_LABELS[user.role] : user.role },
                { label: 'Last sign-in', value: formatDateTime(user.lastLogin) },
              ]}
            />
            <form
              className="flex flex-col gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                if (name.trim().length < 3) return toast.error('Your name needs at least 3 characters.');
                try {
                  await updateProfile.mutateAsync({ name });
                  toast.success('Name updated.');
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
            >
              <Input label="Display name" value={name} maxLength={50} onChange={(event) => setName(event.target.value)} />
              <div className="flex justify-end">
                <Button type="submit" variant="secondary" disabled={name.trim() === user.name} loading={updateProfile.isPending}>
                  Save name
                </Button>
              </div>
            </form>
          </div>
        </Section>
        <Section title="Password" description="Use 8 to 32 characters.">
          <form className="flex flex-col gap-4" onSubmit={savePassword} noValidate>
            <FormError message={passwordError} />
            <Input label="Current password" type="password" autoComplete="current-password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} />
            <Input label="New password" type="password" autoComplete="new-password" value={passwords.next} onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))} />
            <Input label="Repeat new password" type="password" autoComplete="new-password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} />
            <div className="flex justify-end">
              <Button type="submit" loading={changePassword.isPending} disabled={!passwords.current || !passwords.next}>
                Change password
              </Button>
            </div>
          </form>
        </Section>
      </div>
    </>
  );
}
