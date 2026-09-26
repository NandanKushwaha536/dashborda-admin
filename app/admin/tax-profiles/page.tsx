'use client';

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Percent,
  RotateCcw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { TaxProfile, useTaxProfiles } from '@/lib/hooks/useCatalog';
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

export default function TaxProfilesPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<TaxProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    hsnCode: '',
    gstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    cessRate: 0,
    inclusive: false,
    isActive: true,
  });

  const queryClient = useQueryClient();
  const { data: taxProfiles = [], isLoading, error, refetch } = useTaxProfiles();

  const handleOpenCreate = () => {
    setEditingProfile(null);
    setFormData({
      name: '',
      hsnCode: '',
      gstRate: 18,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 18,
      cessRate: 0,
      inclusive: false,
      isActive: true,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (profile: TaxProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      hsnCode: profile.hsnCode || '',
      gstRate: profile.gstRate,
      cgstRate: profile.cgstRate,
      sgstRate: profile.sgstRate,
      igstRate: profile.igstRate,
      cessRate: profile.cessRate,
      inclusive: profile.inclusive,
      isActive: profile.isActive,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleGstRateChange = (totalGst: number) => {
    const half = Number((totalGst / 2).toFixed(2));
    setFormData((prev) => ({
      ...prev,
      gstRate: totalGst,
      cgstRate: half,
      sgstRate: half,
      igstRate: totalGst,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSaving(true);
    try {
      if (editingProfile) {
        await api.put(`/admin/catalog-config/tax-profiles/${editingProfile._id}`, formData);
      } else {
        await api.post('/admin/catalog-config/tax-profiles', formData);
      }
      queryClient.invalidateQueries({ queryKey: ['catalog', 'tax-profiles'] });
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save tax profile';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = taxProfiles.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.hsnCode && p.hsnCode.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tax Profiles & GST Slabs"
        description="Configure HSN/SAC codes, GST slabs, and tax treatment applied to catalog products and order line items."
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
              New Tax Profile
            </AdminButton>
          </div>
        }
      />

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold">Backend Tax Engine Notice</p>
            <p>
              The backend catalog tax configuration endpoint is responding with status {String(error)}.
              Products will apply standard GST rules until custom tax profile overrides are synced with the database.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by profile name or HSN code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {filtered.length} profile{filtered.length === 1 ? '' : 's'} registered
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <AdminTableSkeleton rows={5} columns={6} />
        ) : filtered.length === 0 ? (
          <div className="py-12">
            <AdminEmptyState
              icon={<Percent className="w-6 h-6" />}
              title="No tax profiles found"
              description="Create standard GST profiles (e.g. 5%, 12%, 18%, 28%) and bind them to categories or products."
              actionLabel="Create Tax Profile"
              onAction={handleOpenCreate}
            />
          </div>
        ) : (
          <AdminTable
            headers={[
              'Profile Name',
              'HSN / SAC',
              'Total GST',
              'CGST / SGST',
              'IGST',
              'CESS',
              'Pricing Rule',
              'Status',
              'Actions',
            ]}
          >
            {filtered.map((profile) => (
              <AdminTableRow key={profile._id}>
                <AdminTableCell>
                  <div className="font-medium text-slate-900">{profile.name}</div>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {profile.hsnCode || '—'}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="font-bold text-slate-900">{profile.gstRate}%</span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-xs text-slate-600">
                    {profile.cgstRate}% / {profile.sgstRate}%
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-xs text-slate-600">{profile.igstRate}%</span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-xs text-slate-600">{profile.cessRate}%</span>
                </AdminTableCell>
                <AdminTableCell>
                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      profile.inclusive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {profile.inclusive ? 'Inclusive of Tax' : 'Exclusive (Add-on)'}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <AdminStatusBadge status={profile.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </AdminTableCell>
                <AdminTableCell>
                  <AdminButton
                    variant="outline"
                    size="xs"
                    onClick={() => handleOpenEdit(profile)}
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
        title={editingProfile ? 'Edit Tax Profile' : 'New Tax Profile'}
        description="Specify tax brackets for automatic invoice calculations in order checkout."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <AdminInput
            label="Profile Name"
            placeholder="e.g. Standard GST 18%, Essentials 5%, Luxury 28%"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <AdminInput
            label="HSN / SAC Code"
            placeholder="e.g. 6109, 8517, 9983"
            value={formData.hsnCode}
            onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <AdminInput
              label="Total GST Rate (%)"
              type="number"
              step="0.01"
              value={formData.gstRate}
              onChange={(e) => handleGstRateChange(parseFloat(e.target.value) || 0)}
              required
            />
            <AdminInput
              label="CESS Rate (%)"
              type="number"
              step="0.01"
              value={formData.cessRate}
              onChange={(e) => setFormData({ ...formData, cessRate: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">CGST</span>
              <span className="font-bold text-slate-800">{formData.cgstRate}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">SGST</span>
              <span className="font-bold text-slate-800">{formData.sgstRate}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">IGST</span>
              <span className="font-bold text-slate-800">{formData.igstRate}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-y border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Catalog Price Inclusive</span>
              <span className="text-[11px] text-slate-500">
                Are retail prices already inclusive of this tax rate?
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.inclusive}
              onChange={(e) => setFormData({ ...formData, inclusive: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Active Status</span>
              <span className="text-[11px] text-slate-500">
                Make this profile selectable when creating products
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
              {isSaving ? 'Saving...' : editingProfile ? 'Update Profile' : 'Create Profile'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
