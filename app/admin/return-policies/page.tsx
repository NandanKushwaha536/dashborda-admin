'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertCircle,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { ReturnPolicy, useReturnPolicies } from '@/lib/hooks/useCatalog';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminModal } from '@/components/admin/ui/AdminModal';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { api } from '@/lib/api/client';
import { useQueryClient } from '@tanstack/react-query';

export default function ReturnPoliciesPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ReturnPolicy | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    isReturnable: true,
    returnWindowDays: 7,
    resolution: 'BOTH' as 'REFUND' | 'REPLACEMENT' | 'BOTH' | 'NONE',
    requiresInspection: true,
    isActive: true,
  });

  const queryClient = useQueryClient();
  const { data: returnPolicies = [], isLoading, error, refetch } = useReturnPolicies();

  const handleOpenCreate = () => {
    setEditingPolicy(null);
    setFormData({
      name: '',
      isReturnable: true,
      returnWindowDays: 7,
      resolution: 'BOTH',
      requiresInspection: true,
      isActive: true,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (policy: ReturnPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      isReturnable: policy.isReturnable,
      returnWindowDays: policy.returnWindowDays,
      resolution: policy.resolution,
      requiresInspection: policy.requiresInspection,
      isActive: policy.isActive,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSaving(true);
    try {
      if (editingPolicy) {
        await api.put(`/admin/catalog-config/return-policies/${editingPolicy._id}`, formData);
      } else {
        await api.post('/admin/catalog-config/return-policies', formData);
      }
      queryClient.invalidateQueries({ queryKey: ['catalog', 'return-policies'] });
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save return policy';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = returnPolicies.filter((p) => {
    if (!search) return true;
    return p.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Return & Replacement Policies"
        description="Establish customer return windows, QC inspection criteria, and resolution modes per catalog product."
        actions={
          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Refresh
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Return Policy
            </AdminButton>
          </div>
        }
      />

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">Backend Policy Registry Notice</p>
            <p>
              The backend return policy configuration endpoint is responding with status {String(error)}.
              Catalog defaults (7-day replacement/refund with QC inspection) will govern customer requests.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search return policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {filtered.length} polic{filtered.length === 1 ? 'y' : 'ies'} registered
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <AdminTableSkeleton rows={4} columns={6} />
        ) : filtered.length === 0 ? (
          <div className="py-12">
            <AdminEmptyState
              icon={<RotateCcw className="w-6 h-6" />}
              title="No return policies found"
              description="Define policies like 7-Day Easy Replacement, 14-Day Return & Refund, or Non-Returnable."
              actionLabel="Create Return Policy"
              onAction={handleOpenCreate}
            />
          </div>
        ) : (
          <AdminTable
            headers={[
              'Policy Name',
              'Returnable',
              'Return Window',
              'Allowed Resolution',
              'QC Inspection',
              'Status',
              'Actions',
            ]}
          >
            {filtered.map((policy) => (
              <AdminTableRow key={policy._id}>
                <AdminTableCell>
                  <div className="font-medium text-slate-900">{policy.name}</div>
                </AdminTableCell>
                <AdminTableCell>
                  {policy.isReturnable ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Returnable
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                      <XCircle className="w-3.5 h-3.5" /> Non-Returnable
                    </span>
                  )}
                </AdminTableCell>
                <AdminTableCell>
                  <span className="font-semibold text-slate-900">
                    {policy.isReturnable ? `${policy.returnWindowDays} Days` : 'N/A'}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {policy.resolution}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-xs text-slate-600">
                    {policy.requiresInspection ? 'Mandatory QC' : 'Direct Approval'}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <AdminStatusBadge status={policy.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </AdminTableCell>
                <AdminTableCell>
                  <AdminButton
                    variant="outline"
                    size="xs"
                    onClick={() => handleOpenEdit(policy)}
                  >
                    Edit
                  </AdminButton>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPolicy ? 'Edit Return Policy' : 'New Return Policy'}
        description="Specify conditions under which buyers can request returns, replacements, or refunds."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <AdminInput
            label="Policy Name"
            placeholder="e.g. Standard 7-Day Replacement, 10-Day Electronics Return"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="flex items-center justify-between py-2 border-y border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Allow Returns</span>
              <span className="text-[11px] text-slate-500">
                Are products under this policy eligible for customer return requests?
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.isReturnable}
              onChange={(e) => setFormData({ ...formData, isReturnable: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          {formData.isReturnable && (
            <>
              <AdminInput
                label="Return Window (Days after delivery)"
                type="number"
                min="1"
                max="90"
                value={formData.returnWindowDays}
                onChange={(e) =>
                  setFormData({ ...formData, returnWindowDays: parseInt(e.target.value) || 7 })
                }
                required
              />

              <AdminSelect
                label="Allowed Resolution Method"
                value={formData.resolution}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    resolution: e.target.value as 'REFUND' | 'REPLACEMENT' | 'BOTH' | 'NONE',
                  })
                }
                options={[
                  { value: 'BOTH', label: 'Customer Choice: Refund or Replacement' },
                  { value: 'REFUND', label: 'Refund Only (Credited to original source)' },
                  { value: 'REPLACEMENT', label: 'Replacement Only (New unit dispatched)' },
                  { value: 'NONE', label: 'None (Warranty Claim Only)' },
                ]}
              />

              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Require Physical QC Inspection</span>
                  <span className="text-[11px] text-slate-500">
                    Hold refund or replacement until warehouse inspects returned parcel
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.requiresInspection}
                  onChange={(e) =>
                    setFormData({ ...formData, requiresInspection: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Active Status</span>
              <span className="text-[11px] text-slate-500">
                Make this policy active and selectable for products
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <AdminButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </AdminButton>
            <AdminButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving || !formData.name.trim()}
            >
              {isSaving ? 'Saving...' : editingPolicy ? 'Update Policy' : 'Create Policy'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
