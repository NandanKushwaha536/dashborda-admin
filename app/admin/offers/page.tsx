'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Flame,
  Plus,
  RotateCcw,
  Search,
  BadgePercent,
  AlertCircle,
  Eye,
  Edit2,
  Power,
  Calendar,
  Layers,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminModal } from '@/components/admin/ui/AdminModal';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';

export interface OfferItem {
  id: string;
  name: string;
  code: string;
  type: 'BOGO' | 'PERCENTAGE_OFF' | 'FLAT_DISCOUNT' | 'TIERED_VOLUME' | 'FREE_SHIPPING';
  value: number;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'INACTIVE';
  description?: string;
}

interface OfferFormData {
  name: string;
  code: string;
  type: OfferItem['type'];
  value: number;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  status: OfferItem['status'];
  description: string;
}

const INITIAL_FORM: OfferFormData = {
  name: '',
  code: '',
  type: 'PERCENTAGE_OFF',
  value: 15,
  minOrderAmount: 999,
  startDate: '',
  endDate: '',
  status: 'ACTIVE',
  description: '',
};

export default function OffersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OfferItem['status']>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | OfferItem['type']>('ALL');

  // No mock data: real array starts empty as backend endpoint is not mounted
  const [offersList, setOffersList] = useState<OfferItem[]>([]);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferItem | null>(null);
  const [formData, setFormData] = useState<OfferFormData>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  // View details modal
  const [viewingOffer, setViewingOffer] = useState<OfferItem | null>(null);

  const filteredOffers = useMemo(() => {
    return offersList.filter((offer) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!offer.name.toLowerCase().includes(q) && !offer.code.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (statusFilter !== 'ALL' && offer.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== 'ALL' && offer.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [offersList, search, statusFilter, typeFilter]);

  const handleOpenCreate = () => {
    setEditingOffer(null);
    setFormData(INITIAL_FORM);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (offer: OfferItem) => {
    setEditingOffer(offer);
    setFormData({
      name: offer.name,
      code: offer.code,
      type: offer.type,
      value: offer.value,
      minOrderAmount: offer.minOrderAmount,
      startDate: offer.startDate,
      endDate: offer.endDate,
      status: offer.status,
      description: offer.description || '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Offer name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Offer code is required.');
      return;
    }

    // Report missing backend endpoint transparently
    setFormError(
      'Backend API Notice: Dedicated offer management endpoints (POST /api/v1/admin/offers) are not currently mounted on the backend. No fake business records have been written.'
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Promotional Offers & Deals"
        description="Manage automated cart discounts, bundle incentives, tiered volume thresholds, and clearance events."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/coupons">
              <AdminButton variant="outline" size="sm" leftIcon={<BadgePercent className="w-3.5 h-3.5" />}>
                Manage Coupons
              </AdminButton>
            </Link>
            <AdminButton
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Offer
            </AdminButton>
          </div>
        }
      />

      {/* Backend Route Status Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-bold">Backend Architecture Status:</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800 border border-amber-300">
              Offer backend API = MISSING
            </span>
          </div>
          <p>
            The backend service does not currently mount dedicated offer or BOGO discount routes.
            Order-level discount codes are active and handled via{' '}
            <Link href="/admin/coupons" className="text-amber-900 underline font-semibold">
              Coupons
            </Link>
            , and product markdowns can be configured in{' '}
            <Link href="/admin/products" className="text-amber-900 underline font-semibold">
              Products
            </Link>
            .
          </p>
          <p className="text-amber-800/80">
            In compliance with project directives, no mock offers or fake database records are displayed.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <AdminCard>
        <AdminCardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search offers by name or code..."
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
                  setStatusFilter(e.target.value as 'ALL' | OfferItem['status'])
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="EXPIRED">Expired</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="sm:col-span-3">
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as 'ALL' | OfferItem['type'])
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Offer Types</option>
                <option value="PERCENTAGE_OFF">Percentage Discount</option>
                <option value="FLAT_DISCOUNT">Flat Order Discount</option>
                <option value="BOGO">Buy-One-Get-One (BOGO)</option>
                <option value="TIERED_VOLUME">Tiered Volume Pricing</option>
                <option value="FREE_SHIPPING">Free Shipping Incentive</option>
              </select>
            </div>
          </div>
        </AdminCardBody>
      </AdminCard>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {filteredOffers.length === 0 ? (
          <AdminCardBody className="py-12">
            <AdminEmptyState
              icon={<Flame className="w-6 h-6" />}
              title="No active promotional offers"
              description="Backend endpoint GET /api/v1/admin/offers is not currently mounted. Store promotions can be configured via Coupons or Catalog pricing."
              actionLabel="Create Offer"
              onAction={handleOpenCreate}
            />
          </AdminCardBody>
        ) : (
          <AdminTable
            headers={[
              'Offer Name',
              'Code',
              'Type',
              'Benefit',
              'Min. Order',
              'Validity',
              'Status',
              'Actions',
            ]}
          >
            {filteredOffers.map((offer) => (
              <AdminTableRow key={offer.id}>
                <AdminTableCell className="font-semibold text-slate-900 text-xs">
                  {offer.name}
                </AdminTableCell>
                <AdminTableCell className="font-mono font-bold text-blue-600 text-xs">
                  {offer.code}
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {offer.type}
                  </span>
                </AdminTableCell>
                <AdminTableCell className="font-semibold text-slate-900 text-xs">
                  {offer.type === 'PERCENTAGE_OFF' ? `${offer.value}%` : `₹${offer.value}`}
                </AdminTableCell>
                <AdminTableCell className="text-xs text-slate-700">
                  ₹{offer.minOrderAmount.toLocaleString()}
                </AdminTableCell>
                <AdminTableCell className="text-xs text-slate-500">
                  {offer.startDate && offer.endDate
                    ? `${offer.startDate} - ${offer.endDate}`
                    : 'Indefinite'}
                </AdminTableCell>
                <AdminTableCell>
                  <AdminStatusBadge status={offer.status} size="sm" />
                </AdminTableCell>
                <AdminTableCell>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingOffer(offer)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(offer)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                      title="Edit Offer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </div>

      {/* CREATE / EDIT OFFER MODAL (Reuses the same form) */}
      {isFormModalOpen && (
        <AdminModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={editingOffer ? `Edit Offer: ${editingOffer.name}` : 'Create Promotional Offer'}
          description="Configure cart-level discount incentives and automated promotional triggers."
          maxWidth="md"
          footer={
            <>
              <AdminButton
                variant="outline"
                size="sm"
                onClick={() => setIsFormModalOpen(false)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={handleSubmitForm}
              >
                {editingOffer ? 'Save Changes' : 'Create Offer'}
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
                label="Offer Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Summer Super Deal"
                required
              />
              <AdminInput
                label="Offer Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SUMMER15"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AdminSelect
                label="Offer Type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as OfferItem['type'],
                  })
                }
                options={[
                  { label: 'Percentage Discount (%)', value: 'PERCENTAGE_OFF' },
                  { label: 'Flat Order Discount (₹)', value: 'FLAT_DISCOUNT' },
                  { label: 'Buy-One-Get-One (BOGO)', value: 'BOGO' },
                  { label: 'Tiered Volume Pricing', value: 'TIERED_VOLUME' },
                  { label: 'Free Shipping Incentive', value: 'FREE_SHIPPING' },
                ]}
              />

              <AdminInput
                label="Benefit / Value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AdminInput
                label="Min. Cart Requirement (₹)"
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minOrderAmount: Number(e.target.value) })
                }
                required
              />

              <AdminSelect
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as OfferItem['status'],
                  })
                }
                options={[
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Scheduled', value: 'SCHEDULED' },
                  { label: 'Inactive', value: 'INACTIVE' },
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
                Description & Terms
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Offer terms, restrictions, applicable catalog categories..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
