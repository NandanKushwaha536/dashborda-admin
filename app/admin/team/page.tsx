'use client';

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useStaff, useStaffMutations, type StaffMember } from '@/lib/hooks/useStaff';
import { useAuth } from '@/lib/auth/AuthContext';
import { ASSIGNABLE_ROLES, ROLE_LABELS, isAdminRole, roleAreas, type AdminRole } from '@/lib/auth/permissions';
import { errorMessage, formatDateTime } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { PageHeader, Section } from '@/components/ui/Layout';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Feedback';
import { Button, EditAction } from '@/components/ui/Button';
import { FormError, Input, Select } from '@/components/ui/Form';
import { Modal, useToast } from '@/components/ui/Overlay';

/** Roles the owner can hand out here; a second owner is set up on the backend, not from the panel. */
const roleOption = (role: AdminRole) => ({ value: role, label: ROLE_LABELS[role] });
const ROLE_OPTIONS = ASSIGNABLE_ROLES.map(roleOption);
const roleLabel = (role: string) => (isAdminRole(role) ? ROLE_LABELS[role] : role);

function AddStaffDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const { create } = useStaffMutations();
  const [values, setValues] = useState({ name: '', email: '', phone: '', password: '', role: 'ORDER_MANAGER' as AdminRole, ownerPassword: '' });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setValues({ name: '', email: '', phone: '', password: '', role: 'ORDER_MANAGER', ownerPassword: '' });
      setError(null);
    }
  }, [open]);
  const field = (key: keyof typeof values) => ({
    value: values[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues((v) => ({ ...v, [key]: event.target.value })),
  });
  const save = async () => {
    setError(null);
    if (values.name.trim().length < 3) return setError('Name: at least 3 characters.');
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) return setError('Enter a valid email.');
    if (values.phone.trim() && !/^[6-9]\d{9}$/.test(values.phone.trim())) return setError('Phone: 10-digit Indian mobile number.');
    if (values.password.length < 8) return setError('Their first password needs at least 8 characters.');
    if (!values.ownerPassword) return setError('Enter your own password to confirm.');
    try {
      await create.mutateAsync(values);
      toast.success(`${values.name.trim()} added. Share the email and first password with them privately.`);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={create.isPending}
      size="lg"
      title="Add staff member"
      description="They sign in with this email and password, and should change the password after the first sign-in."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={save} loading={create.isPending}>
            Add staff member
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormError message={error} />
        </div>
        <Input label="Full name" required {...field('name')} />
        <Input label="Email" type="email" required autoComplete="off" {...field('email')} />
        <Input label="Mobile (optional)" type="tel" inputMode="numeric" maxLength={10} {...field('phone')} />
        <Select label="Role" required {...field('role')} options={ROLE_OPTIONS} hint={roleAreas(values.role).join(' · ') || 'Read-only access'} />
        <Input label="First password" type="password" autoComplete="new-password" required {...field('password')} hint="8 or more characters." />
        <Input label="Your password" type="password" autoComplete="current-password" required {...field('ownerPassword')} hint="Confirms it's you." />
      </div>
    </Modal>
  );
}

function EditStaffDialog({ member, onClose }: { member: StaffMember; onClose: () => void }) {
  const toast = useToast();
  const { update } = useStaffMutations();
  const [role, setRole] = useState<AdminRole>(isAdminRole(member.role) && member.role !== 'SUPER_ADMIN' ? member.role : 'ADMIN');
  const [blocked, setBlocked] = useState(member.status === 'BLOCKED');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setError(null);
    if (!ownerPassword) return setError('Enter your own password to confirm.');
    try {
      await update.mutateAsync({ id: member.id, ownerPassword, role, status: blocked ? 'BLOCKED' : 'ACTIVE' });
      toast.success(`${member.name} updated.`);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      busy={update.isPending}
      title={`Edit ${member.name}`}
      description={member.email}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={save} loading={update.isPending}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormError message={error} />
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as AdminRole)}
          // Keep a member's current role selectable even if it is no longer offered for new staff.
          options={ASSIGNABLE_ROLES.includes(role) ? ROLE_OPTIONS : [...ROLE_OPTIONS, roleOption(role)]}
          hint={roleAreas(role).join(' · ') || 'Nothing in this admin'}
        />
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} className="h-5 w-5 accent-red-600" />
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">Block this account</span>
            <span className="text-[12.5px] text-slate-600">They can no longer sign in.</span>
          </span>
        </label>
        <Input label="Your password" type="password" autoComplete="current-password" required value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} />
      </div>
    </Modal>
  );
}

function TeamView() {
  const { user } = useAuth();
  const staff = useStaff();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const status = (m: StaffMember) => <Badge tone={m.status === 'ACTIVE' ? 'green' : 'red'}>{m.status === 'ACTIVE' ? 'Active' : 'Blocked'}</Badge>;
  const editButton = (m: StaffMember) =>
    m.id !== user?.id && m.role !== 'SUPER_ADMIN' ? (
      <EditAction onClick={() => setEditing(m)} />
    ) : null;

  const columns: Column<StaffMember>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (m) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {m.name}
            {m.id === user?.id ? <span className="text-slate-500"> (you)</span> : null}
          </span>
          <span className="text-[12px] text-slate-500">{m.email}</span>
        </div>
      ),
    },
    { key: 'role', header: 'Role', cell: (m) => <span className="text-slate-700">{roleLabel(m.role)}</span> },
    { key: 'last', header: 'Last sign-in', cell: (m) => <span className="text-slate-600">{formatDateTime(m.lastLogin)}</span> },
    { key: 'status', header: 'Status', cell: status },
    { key: 'edit', header: 'Actions', align: 'right', cell: editButton },
  ];

  return (
    <>
      <PageHeader
        title="Team & roles"
        description="Give each person only the access their job needs."
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setAdding(true)}>
            Add staff
          </Button>
        }
      />
      <Section title="Staff" bodyClassName="p-0 sm:p-0">
        <DataTable
          caption="Staff"
          rows={staff.data ?? []}
          columns={columns}
          getRowId={(m) => m.id}
          loading={staff.isLoading}
          error={staff.error ? errorMessage(staff.error) : null}
          onRetry={() => staff.refetch()}
          minWidth={680}
          empty={{ title: 'Only you so far', description: 'Add staff to share the work.' }}
          mobileCard={(m) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-semibold">{m.name}</span>
                  <span className="text-[12.5px] text-slate-500">{m.email}</span>
                </div>
                {status(m)}
              </div>
              <span className="text-[13px] text-slate-700">{roleLabel(m.role)}</span>
              {editButton(m)}
            </div>
          )}
        />
      </Section>
      <Section title="What each role can do">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
          {(['SUPER_ADMIN', ...ASSIGNABLE_ROLES] as AdminRole[]).map((role) => (
            <div key={role} className="flex flex-col gap-0.5 rounded-lg border border-slate-100 px-3 py-2.5">
              <dt className="text-sm font-semibold text-slate-900">{ROLE_LABELS[role]}</dt>
              <dd className="text-[13px] text-slate-600">{roleAreas(role).join(' · ')}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <AddStaffDialog open={adding} onClose={() => setAdding(false)} />
      {editing ? <EditStaffDialog member={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

export default function TeamPage() {
  return (
    <Restricted ownerOnly>
      <TeamView />
    </Restricted>
  );
}
