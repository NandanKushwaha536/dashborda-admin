'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Plus,
  RotateCcw,
  Search,
  BadgePercent,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  CampaignItem,
  CreateCampaignInput,
} from '@/lib/hooks/useCampaigns';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { AdminModal } from '@/components/admin/ui/AdminModal';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';

const INITIAL_FORM: CreateCampaignInput = {
  name: '',
  code: '',
  type: 'SEASONAL',
  startDate: '',
  endDate: '',
  status: 'DRAFT',
  description: '',
};

export default function CampaignsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CampaignItem['status']>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | CampaignItem['type']>('ALL');

  // React Query Hooks wired directly to backend /admin/campaigns API
  const { data: rawCampaigns = [], isLoading, error, refetch } = useCampaigns();
  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const deleteMutation = useDeleteCampaign();

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);
  const [formData, setFormData] = useState<CreateCampaignInput>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  // View details modal
  const [viewingCampaign, setViewingCampaign] = useState<CampaignItem | null>(null);

  const filteredCampaigns = useMemo(() => {
    return rawCampaigns.filter((camp) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!camp.name.toLowerCase().includes(q) && !camp.code.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (statusFilter !== 'ALL' && camp.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== 'ALL' && camp.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [rawCampaigns, search, statusFilter, typeFilter]);

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setFormData(INITIAL_FORM);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (camp: CampaignItem) => {
    setEditingCampaign(camp);
    setFormData({
      name: camp.name,
      code: camp.code,
      type: camp.type,
      startDate: camp.startDate ? camp.startDate.slice(0, 10) : '',
      endDate: camp.endDate ? camp.endDate.slice(0, 10) : '',
      status: camp.status,
      description: camp.description || '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (camp: CampaignItem) => {
    if (window.confirm(`Delete campaign "${camp.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(camp.id || camp._id || '');
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete campaign');
      }
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Campaign name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Campaign code is required.');
      return;
    }

    try {
      if (editingCampaign) {
        await updateMutation.mutateAsync({
          id: editingCampaign.id || editingCampaign._id || '',
          data: {
            name: formData.name.trim(),
            code: formData.code.trim().toUpperCase(),
            type: formData.type,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: formData.status,
            description: formData.description,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          description: formData.description,
        });
      }
      setIsFormModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save campaign to backend.');
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Marketing Campaigns"
        description="Organize seasonal sales events, multi-channel promotional blasts, and track revenue attribution."
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
            <Link href="/admin/coupons">
              <AdminButton variant="outline" size="sm" leftIcon={<BadgePercent className="w-3.5 h-3.5" />}>
                Coupons Ledger
              </AdminButton>
            </Link>
            <AdminButton
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Campaign
            </AdminButton>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <AdminCard>
        <AdminCardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search campaigns by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'ALL' | CampaignItem['status'])
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="sm:col-span-3">
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as 'ALL' | CampaignItem['type'])
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="SEASONAL">Seasonal Event</option>
                <option value="HOLIDAY">Holiday Sale</option>
                <option value="FLASH_EVENT">Flash Event</option>
                <option value="EMAIL_MARKETING">Email Blast</option>
                <option value="CLEARANCE">Inventory Clearance</option>
              </select>
            </div>
          </div>
        </AdminCardBody>
      </AdminCard>

      {/* Campaigns Table or Skeleton or Empty State */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <AdminTableSkeleton rows={5} columns={8} />
        ) : error ? (
          <div className="py-12">
            <AdminErrorState
              title="Campaigns Backend Notice"
              message={error instanceof Error ? error.message : 'Unable to query backend campaigns.'}
              onRetry={() => refetch()}
            />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <AdminCardBody className="py-12">
            <AdminEmptyState
              icon={<Megaphone className="w-6 h-6" />}
              title="No active marketing campaigns"
              description="No campaign records found on the backend. You can create a new campaign or manage promotional codes via Coupons."
              actionLabel="Create Campaign"
              onAction={handleOpenCreate}
            />
          </AdminCardBody>
        ) : (
          <AdminTable
            headers={[
              'Campaign Name',
              'Campaign Code',
              'Campaign Type',
              'Start Date',
              'End Date',
              'Status',
              'Description',
              'Actions',
            ]}
          >
            {filteredCampaigns.map((camp) => (
              <AdminTableRow key={camp.id || camp._id}>
                <AdminTableCell className="font-semibold text-slate-900 text-xs">
                  {camp.name}
                </AdminTableCell>
                <AdminTableCell className="font-mono font-bold text-blue-600 text-xs">
                  {camp.code}
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {camp.type}
                  </span>
                </AdminTableCell>
                <AdminTableCell className="text-xs text-slate-600">
                  {camp.startDate ? camp.startDate.slice(0, 10) : '—'}
                </AdminTableCell>
                <AdminTableCell className="text-xs text-slate-600">
                  {camp.endDate ? camp.endDate.slice(0, 10) : '—'}
                </AdminTableCell>
                <AdminTableCell>
                  <AdminStatusBadge status={camp.status} size="sm" />
                </AdminTableCell>
                <AdminTableCell className="text-xs text-slate-600 max-w-[200px] truncate">
                  <span title={camp.description}>{camp.description || '—'}</span>
                </AdminTableCell>
                <AdminTableCell>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingCampaign(camp)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(camp)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                      title="Edit Campaign"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(camp)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </div>

      {/* CREATE / EDIT CAMPAIGN MODAL */}
      {isFormModalOpen && (
        <AdminModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={editingCampaign ? `Edit Campaign: ${editingCampaign.name}` : 'Create Marketing Campaign'}
          description="Define campaign duration, parameters, and promotional theme on backend."
          maxWidth="md"
          footer={
            <>
              <AdminButton
                variant="outline"
                size="sm"
                onClick={() => setIsFormModalOpen(false)}
                disabled={isMutating}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={handleSubmitForm}
                isLoading={isMutating}
              >
                {editingCampaign ? 'Save Changes' : 'Create Campaign'}
              </AdminButton>
            </>
          }
        >
          <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{formError}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AdminInput
                label="Campaign Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Festive Mega Sale"
                required
              />

              <AdminInput
                label="Campaign Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. FESTIVE-2026"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AdminSelect
                label="Campaign Type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as CampaignItem['type'],
                  })
                }
                options={[
                  { label: 'Seasonal Event', value: 'SEASONAL' },
                  { label: 'Holiday Sale', value: 'HOLIDAY' },
                  { label: 'Flash Event', value: 'FLASH_EVENT' },
                  { label: 'Email Marketing', value: 'EMAIL_MARKETING' },
                  { label: 'Inventory Clearance', value: 'CLEARANCE' },
                ]}
              />

              <AdminSelect
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as CampaignItem['status'],
                  })
                }
                options={[
                  { label: 'Draft', value: 'DRAFT' },
                  { label: 'Scheduled', value: 'SCHEDULED' },
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Paused', value: 'PAUSED' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AdminInput
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />

              <AdminInput
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description & Strategy
              </label>
              <textarea
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Target segment, banner placement, promotional strategy..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>
        </AdminModal>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingCampaign && (
        <AdminModal
          isOpen={Boolean(viewingCampaign)}
          onClose={() => setViewingCampaign(null)}
          title={`Campaign Details: ${viewingCampaign.name}`}
          maxWidth="md"
          footer={
            <AdminButton variant="outline" size="sm" onClick={() => setViewingCampaign(null)}>
              Close
            </AdminButton>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Code</span>
                <span className="font-mono font-bold text-blue-600">{viewingCampaign.code}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Status</span>
                <AdminStatusBadge status={viewingCampaign.status} size="sm" />
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Type</span>
                <span className="font-semibold text-slate-800">{viewingCampaign.type}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Duration</span>
                <span className="text-slate-700">
                  {viewingCampaign.startDate ? viewingCampaign.startDate.slice(0, 10) : '—'} to{' '}
                  {viewingCampaign.endDate ? viewingCampaign.endDate.slice(0, 10) : '—'}
                </span>
              </div>
            </div>
            {viewingCampaign.description && (
              <div>
                <span className="text-slate-500 block text-[11px] mb-1">Description</span>
                <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                  {viewingCampaign.description}
                </p>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
