'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Warehouse as WarehouseIcon,
  RotateCcw,
  Search,
  Building2,
  AlertCircle,
  Eye,
  Boxes,
  Info,
} from 'lucide-react';
import { Warehouse, WarehouseType, WarehouseStatus } from '@/lib/api/types';
import { useWarehouses } from '@/lib/hooks/useWarehouses';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminModal } from '@/components/admin/ui/AdminModal';

export default function WarehousesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WarehouseStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | WarehouseType>('ALL');
  const [viewingWarehouse, setViewingWarehouse] = useState<Warehouse | null>(null);

  // Hook queries real backend without faking mock data
  const { data: warehouseData, isLoading, refetch } = useWarehouses();
  const isBackendMounted = warehouseData?.isBackendMounted ?? false;

  const filteredWarehouses = useMemo(() => {
    const warehouses = warehouseData?.warehouses || [];
    return warehouses.filter((wh) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          wh.name.toLowerCase().includes(q) ||
          wh.code.toLowerCase().includes(q) ||
          wh.city.toLowerCase().includes(q) ||
          wh.state.toLowerCase().includes(q) ||
          wh.pincode.includes(q);
        if (!matches) return false;
      }
      if (statusFilter !== 'ALL' && wh.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== 'ALL' && wh.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [warehouseData?.warehouses, search, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Warehouses & Fulfillment Centers"
        description="Fulfillment facility management and logistics dispatch topology."
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
            <Link href="/admin/inventory">
              <AdminButton variant="primary" size="sm" leftIcon={<Boxes className="w-4 h-4" />}>
                Inventory Management
              </AdminButton>
            </Link>
          </div>
        }
      />

      {/* Contract Verification Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-bold">Backend Architecture Status:</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800 border border-amber-300">
              WAREHOUSE BACKEND CRUD = MISSING
            </span>
          </div>
          <p>
            The backend data model defines <code className="font-mono font-bold">Warehouse</code>,{' '}
            <code className="font-mono font-bold">WarehouseLocation</code>, and{' '}
            <code className="font-mono font-bold">WarehouseStock</code> in Mongoose, but no RESTful CRUD endpoints
            (<code className="font-mono">GET /api/v1/admin/warehouses</code>,{' '}
            <code className="font-mono">POST /api/v1/admin/warehouses</code>) are mounted on the backend service.
          </p>
          <p className="text-amber-800/80">
            Per API contract requirements, no mock warehouses or fake CRUD actions are generated. Real inventory stock allocations and adjustments are managed directly via the{' '}
            <Link href="/admin/inventory" className="underline font-semibold text-amber-900">
              Inventory Ledger
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <AdminCard>
        <AdminCardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search warehouses by name, code, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | WarehouseStatus)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'ALL' | WarehouseType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Facility Types</option>
                <option value="MAIN">Main Distribution Hub</option>
                <option value="REGIONAL">Regional Warehouse</option>
                <option value="FULFILLMENT">Fulfillment Center</option>
                <option value="TRANSIT">Transit Hub</option>
                <option value="DARK_STORE">Dark Store</option>
              </select>
            </div>
          </div>
        </AdminCardBody>
      </AdminCard>

      {/* Warehouse Listing / Empty State */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <AdminTableSkeleton rows={5} columns={7} />
        ) : filteredWarehouses.length === 0 ? (
          <AdminCardBody className="py-16">
            <AdminEmptyState
              icon={<WarehouseIcon className="w-8 h-8 text-slate-400" />}
              title="No Warehouse Records Returned"
              description="Warehouse CRUD endpoints are not currently provisioned on the backend API. Physical stock counts, SKU distributions, and reservations are tracked live in the Inventory Ledger."
              actionLabel="View Inventory Stock"
              onAction={() => window.location.assign('/admin/inventory')}
            />
          </AdminCardBody>
        ) : (
          <AdminTable
            headers={[
              'Facility / Hub',
              'Code',
              'Type',
              'Location',
              'Contact',
              'Status',
              'Actions',
            ]}
          >
            {filteredWarehouses.map((wh) => (
              <AdminTableRow key={wh.id}>
                <AdminTableCell className="font-semibold text-slate-900 text-xs">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div>{wh.name}</div>
                      {wh.isDefault && (
                        <span className="text-[10px] text-blue-600 font-medium">Primary Hub</span>
                      )}
                    </div>
                  </div>
                </AdminTableCell>
                <AdminTableCell className="font-mono text-xs text-slate-600 font-bold">
                  {wh.code}
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {wh.type}
                  </span>
                </AdminTableCell>
                <AdminTableCell className="text-xs text-slate-600">
                  {wh.city}, {wh.state}
                </AdminTableCell>
                <AdminTableCell className="text-xs text-slate-600">
                  {wh.contactPerson || wh.phone || '—'}
                </AdminTableCell>
                <AdminTableCell>
                  <AdminStatusBadge status={wh.status} size="sm" />
                </AdminTableCell>
                <AdminTableCell>
                  <button
                    type="button"
                    onClick={() => setViewingWarehouse(wh)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </div>

      {/* Details Modal */}
      {viewingWarehouse && (
        <AdminModal
          isOpen={Boolean(viewingWarehouse)}
          onClose={() => setViewingWarehouse(null)}
          title={`Facility: ${viewingWarehouse.name}`}
          maxWidth="md"
          footer={
            <AdminButton variant="outline" size="sm" onClick={() => setViewingWarehouse(null)}>
              Close
            </AdminButton>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Facility Code</span>
                <span className="font-mono font-bold text-slate-900">{viewingWarehouse.code}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Facility Type</span>
                <span className="font-semibold text-slate-900">{viewingWarehouse.type}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Operational Status</span>
                <AdminStatusBadge status={viewingWarehouse.status} size="sm" />
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Primary Center</span>
                <span className="text-slate-900 font-medium">
                  {viewingWarehouse.isDefault ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] mb-1 font-semibold">Address</span>
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700 space-y-0.5">
                <div>{viewingWarehouse.addressLine1}</div>
                {viewingWarehouse.addressLine2 && <div>{viewingWarehouse.addressLine2}</div>}
                <div>
                  {viewingWarehouse.city}, {viewingWarehouse.state} — {viewingWarehouse.pincode}
                </div>
                <div>{viewingWarehouse.country}</div>
              </div>
            </div>

            {(viewingWarehouse.contactPerson || viewingWarehouse.phone || viewingWarehouse.email) && (
              <div>
                <span className="text-slate-500 block text-[11px] mb-1 font-semibold">
                  Facility Contact
                </span>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700 space-y-1">
                  {viewingWarehouse.contactPerson && (
                    <div>Person: {viewingWarehouse.contactPerson}</div>
                  )}
                  {viewingWarehouse.phone && <div>Phone: {viewingWarehouse.phone}</div>}
                  {viewingWarehouse.email && <div>Email: {viewingWarehouse.email}</div>}
                </div>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
