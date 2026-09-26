'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  Users,
  Info,
  Shield,
} from 'lucide-react';
import { useRoles, useUpdateRolePermissions } from '@/lib/hooks/useGovernance';
import { RolePermission } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/useAuth';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { AdminModal } from '@/components/admin/ui/AdminModal';
import { PermissionGate } from '@/components/admin/auth/PermissionGate';

const PERMISSION_DOMAINS: {
  domain: string;
  label: string;
  permissions: { key: string; name: string; description: string }[];
}[] = [
  {
    domain: 'orders',
    label: 'Orders Management',
    permissions: [
      { key: 'orders:read', name: 'Read Orders', description: 'View order lists, detail records, and customer notes' },
      { key: 'orders:write', name: 'Manage Orders', description: 'Update status, cancel orders, and edit items' },
    ],
  },
  {
    domain: 'products',
    label: 'Products & Catalog',
    permissions: [
      { key: 'products:read', name: 'Read Catalog', description: 'Browse products, categories, and brands' },
      { key: 'products:write', name: 'Manage Catalog', description: 'Create, edit, or archive products and categories' },
    ],
  },
  {
    domain: 'inventory',
    label: 'Inventory & Warehouses',
    permissions: [
      { key: 'inventory:read', name: 'View Stock', description: 'Check SKU quantities and warehouse allocations' },
      { key: 'inventory:write', name: 'Adjust Stock', description: 'Perform manual restocks, write-offs, and transfers' },
    ],
  },
  {
    domain: 'finance',
    label: 'Finance & Payments',
    permissions: [
      { key: 'finance:read', name: 'View Financials', description: 'Review settlement ledgers, summaries, and tax data' },
      { key: 'finance:write', name: 'Authorize Payouts & Refunds', description: 'Issue customer refunds and export financial audits' },
    ],
  },
  {
    domain: 'customers',
    label: 'Customer Accounts',
    permissions: [
      { key: 'customers:read', name: 'View Customers', description: 'Access customer profiles and purchase history' },
      { key: 'customers:write', name: 'Manage Customers', description: 'Update loyalty tiers, block or unblock accounts' },
    ],
  },
  {
    domain: 'marketing',
    label: 'Marketing & Promotions',
    permissions: [
      { key: 'marketing:read', name: 'View Campaigns', description: 'Inspect coupon codes, promotional banners, and offers' },
      { key: 'marketing:write', name: 'Manage Marketing', description: 'Publish discount codes, flash sales, and content' },
    ],
  },
  {
    domain: 'users',
    label: 'Staff Governance',
    permissions: [
      { key: 'users:read', name: 'View Staff', description: 'List administrative personnel and assigned roles' },
      { key: 'users:write', name: 'Manage Staff', description: 'Invite team members, assign roles, and revoke access' },
    ],
  },
  {
    domain: 'settings',
    label: 'Store & Platform Settings',
    permissions: [
      { key: 'settings:read', name: 'View Configuration', description: 'Inspect platform rules, taxes, and integrations' },
      { key: 'settings:write', name: 'Modify Configuration', description: 'Update store information, payment keys, and policies' },
    ],
  },
];

const DEFAULT_ROLES: RolePermission[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Unrestricted master access to all commercial, governance, and financial subsystems.',
    permissions: PERMISSION_DOMAINS.flatMap((d) => d.permissions.map((p) => p.key)),
    isSystem: true,
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Comprehensive store management with access to catalog, orders, and customer operations.',
    permissions: [
      'orders:read',
      'orders:write',
      'products:read',
      'products:write',
      'inventory:read',
      'inventory:write',
      'finance:read',
      'customers:read',
      'customers:write',
      'marketing:read',
      'marketing:write',
      'users:read',
      'settings:read',
    ],
    isSystem: true,
  },
  {
    id: 'catalog_manager',
    name: 'Catalog Manager',
    description: 'Dedicated catalog curator managing products, categories, brands, variants, and stock levels.',
    permissions: [
      'products:read',
      'products:write',
      'inventory:read',
      'inventory:write',
      'marketing:read',
    ],
    isSystem: false,
  },
  {
    id: 'order_manager',
    name: 'Order Manager',
    description: 'Operations specialist managing fulfillment processing, customer confirmations, and delivery coordination.',
    permissions: [
      'orders:read',
      'orders:write',
      'products:read',
      'inventory:read',
      'customers:read',
    ],
    isSystem: false,
  },
  {
    id: 'finance_manager',
    name: 'Finance Manager',
    description: 'Treasury and accounting controller handling ledgers, settlements, tax profiles, and refunds.',
    permissions: [
      'orders:read',
      'finance:read',
      'finance:write',
      'customers:read',
    ],
    isSystem: false,
  },
  {
    id: 'support',
    name: 'Support Agent',
    description: 'Frontline customer service representative managing customer queries, returns, and reviews.',
    permissions: [
      'orders:read',
      'products:read',
      'customers:read',
      'marketing:read',
    ],
    isSystem: false,
  },
];

export default function RolesPage() {
  const { user } = useAuth();
  const { data: backendRoles = [], isLoading, error, refetch } = useRoles();
  const updatePermissionsMutation = useUpdateRolePermissions();

  const [editingRole, setEditingRole] = useState<RolePermission | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // If backend returns populated roles use them; otherwise use standard system default roles
  const roles = backendRoles.length > 0 ? backendRoles : DEFAULT_ROLES;

  const handleOpenEdit = (role: RolePermission) => {
    setEditingRole(role);
    setSelectedPermissions(role.permissions || []);
  };

  const handleTogglePermission = (permKey: string) => {
    if (selectedPermissions.includes(permKey)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permKey));
    } else {
      setSelectedPermissions([...selectedPermissions, permKey]);
    }
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;
    try {
      await updatePermissionsMutation.mutateAsync({
        id: editingRole.id,
        permissions: selectedPermissions,
      });
      setEditingRole(null);
    } catch {
      // Handled by react-query
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <PermissionGate allowedRoles={['SUPER_ADMIN', 'ADMIN']} requiredPermission="view:users">
      <div className="space-y-6">
        <AdminPageHeader
          title="Roles & Domain Permissions"
          description="Enforce Role-Based Access Control (RBAC) across Commerce, Finance, Catalog, and Staff Governance."
        />

        {/* Roles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                <AdminSkeleton className="h-5 w-1/3" />
                <AdminSkeleton className="h-12 w-full" />
                <AdminSkeleton className="h-8 w-1/2" />
              </div>
            ))}
          </div>
        ) : error && backendRoles.length === 0 ? (
          <AdminErrorState
            title="Failed to load roles"
            message="Could not retrieve RBAC role mappings from the backend."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.map((role) => {
              const isSuper = role.id === 'super_admin' || role.name === 'Super Admin';
              const canEdit = isSuperAdmin ? true : !isSuper;

              return (
                <AdminCard key={role.id} className="flex flex-col justify-between p-5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isSuper
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{role.name}</h3>
                          <span className="text-[10px] font-mono text-slate-400">ID: {role.id}</span>
                        </div>
                      </div>

                      {role.isSystem && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          System Role
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 min-h-[36px] line-clamp-2">
                      {role.description}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span>Assigned Permissions</span>
                        <span className="font-bold text-slate-900">{role.permissions.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {role.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {isSuper ? 'Locked system privileges' : 'Granular access'}
                    </span>
                    {canEdit ? (
                      <AdminButton
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenEdit(role)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit Privileges
                      </AdminButton>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Lock className="w-3 h-3" />
                        <span>Restricted</span>
                      </div>
                    )}
                  </div>
                </AdminCard>
              );
            })}
          </div>
        )}

        {/* Edit Role Permissions Modal */}
        <AdminModal
          isOpen={Boolean(editingRole)}
          onClose={() => setEditingRole(null)}
          title={`Configure Permissions: ${editingRole?.name}`}
          description="Grant or revoke specific API and business privileges for this operational role."
          size="lg"
        >
          {editingRole && (
            <div className="space-y-5 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  Modifying permissions applies immediately to all staff accounts assigned to the{' '}
                  <strong>{editingRole.name}</strong> role upon their next API request.
                </span>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {PERMISSION_DOMAINS.map((domain) => (
                  <div
                    key={domain.domain}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{domain.label}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        domain:{domain.domain}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {domain.permissions.map((p) => {
                        const isChecked = selectedPermissions.includes(p.key);
                        return (
                          <label
                            key={p.key}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                              isChecked
                                ? 'bg-white border-blue-300 shadow-2xs'
                                : 'bg-transparent border-slate-200 hover:bg-white/60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(p.key)}
                              className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 mt-0.5"
                            />
                            <div>
                              <p className="font-semibold text-slate-800">{p.name}</p>
                              <p className="text-[10px] text-slate-500">{p.description}</p>
                              <code className="text-[10px] text-blue-600 font-mono mt-0.5 block">
                                {p.key}
                              </code>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-slate-500 font-medium">
                  {selectedPermissions.length} total privileges selected
                </span>
                <div className="flex gap-2">
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingRole(null)}
                  >
                    Cancel
                  </AdminButton>
                  <AdminButton
                    variant="primary"
                    size="sm"
                    onClick={handleSavePermissions}
                    isLoading={updatePermissionsMutation.isPending}
                  >
                    Save Permissions
                  </AdminButton>
                </div>
              </div>
            </div>
          )}
        </AdminModal>
      </div>
    </PermissionGate>
  );
}
