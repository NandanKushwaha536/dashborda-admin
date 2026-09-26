'use client';

import React, { useState } from 'react';
import { useAdminUsers, useInviteAdminUser, StaffUser } from '@/lib/hooks/useAdminUsers';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { AdminModal } from '@/components/admin/ui/AdminModal';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { UserCog, Plus } from 'lucide-react';
import { PermissionGate } from '@/components/admin/auth/PermissionGate';

export default function AdminUsersPage() {
  const { data: usersData, isLoading, error, refetch } = useAdminUsers();
  const users = Array.isArray(usersData) ? usersData : [];
  const inviteMutation = useInviteAdminUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'MANAGER' as StaffUser['role'],
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    await inviteMutation.mutateAsync({
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
    });

    setIsModalOpen(false);
    setFormData({ name: '', email: '', role: 'MANAGER' });
  };

  return (
    <PermissionGate allowedRoles={['SUPER_ADMIN', 'ADMIN']} requiredPermission="manage:users">
      <div className="space-y-6">
        <AdminPageHeader
          title="Administrative Staff & RBAC"
          description="Configure staff user roles, operational permission scopes, and session access."
          actions={
            <AdminButton
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Invite Staff Member
            </AdminButton>
          }
        />

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <AdminTableSkeleton rows={5} columns={6} />
        ) : error ? (
          <div className="py-12">
            <AdminErrorState
              title="Failed to load administrative users"
              message="Could not retrieve administrative staff from backend."
              onRetry={() => refetch()}
            />
          </div>
        ) : users.length === 0 ? (
          <AdminEmptyState
            icon={<UserCog className="w-8 h-8" />}
            title="No administrative staff records"
            description="Zero staff members registered in the administrative directory."
            actionLabel="Invite Staff Member"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <AdminTable
            headers={[
              'Staff Member',
              'Email Address',
              'RBAC Role',
              'Access State',
              'Last Active',
              'Permissions',
            ]}
          >
            {users.map((u: StaffUser) => (
              <AdminTableRow key={u.id}>
                <AdminTableCell className="font-semibold text-slate-900 text-xs">
                  {u.name}
                </AdminTableCell>

                <AdminTableCell className="text-xs text-slate-600">
                  {u.email}
                </AdminTableCell>

                <AdminTableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                    {u.role}
                  </span>
                </AdminTableCell>

                <AdminTableCell>
                  <AdminStatusBadge status={u.status} size="sm" />
                </AdminTableCell>

                <AdminTableCell className="text-xs text-slate-400">
                  {!u.lastLogin || u.lastLogin === 'Never' ? 'Never' : new Date(u.lastLogin).toLocaleString()}
                </AdminTableCell>

                <AdminTableCell className="text-xs text-slate-500">
                  {u.role === 'SUPER_ADMIN'
                    ? 'All Permissions (*)'
                    : u.role === 'ADMIN'
                    ? 'Commerce, Catalog, Inventory'
                    : 'Orders & Inventory View'}
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </div>

      {isModalOpen && (
        <AdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Invite Staff Administrator"
          description="Assigned role dictates accessible admin routes and mutation privileges."
          maxWidth="md"
          footer={
            <>
              <AdminButton variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={handleCreateUser}
                isLoading={inviteMutation.isPending}
              >
                Send Invitation
              </AdminButton>
            </>
          }
        >
          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <AdminInput
              label="Staff Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Operations Manager"
              required
            />

            <AdminInput
              label="Staff Work Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="staff@rgenterprises.com"
              required
            />

            <AdminSelect
              label="Role Assignment *"
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as StaffUser['role'],
                })
              }
              options={[
                { value: 'SUPER_ADMIN', label: 'Super Admin (Full Access)' },
                { value: 'ADMIN', label: 'Admin (Commercial Operations)' },
                { value: 'MANAGER', label: 'Manager (Catalog & Orders)' },
                { value: 'SUPPORT', label: 'Support (Orders Read & Tickets)' },
              ]}
            />
          </form>
        </AdminModal>
      )}
      </div>
    </PermissionGate>
  );
}
