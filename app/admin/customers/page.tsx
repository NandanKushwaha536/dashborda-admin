'use client';

import React, { useState } from 'react';
import { useCustomers, useUpdateCustomerStatus } from '@/lib/hooks/useCustomers';
import { Customer } from '@/lib/api/types';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminSearchBar } from '@/components/admin/ui/AdminSearchBar';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminPagination } from '@/components/admin/ui/AdminPagination';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { Users, Ban, CheckCircle, RotateCcw } from 'lucide-react';

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data, isLoading, error, refetch } = useCustomers({
    page,
    limit: 15,
    search,
    status: statusFilter,
  });

  const statusMutation = useUpdateCustomerStatus();
  const customers = Array.isArray(data?.customers) ? data.customers : [];
  const total = data?.total || 0;

  const handleToggleStatus = async () => {
    if (!selectedCustomer) return;
    const nextStatus = selectedCustomer.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    await statusMutation.mutateAsync({
      id: selectedCustomer.id,
      status: nextStatus,
    });
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Directory"
        description="View registered accounts, order engagement history, and manage access privileges."
        actions={
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Refresh
          </AdminButton>
        }
      />

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <AdminSearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by customer name, email, or phone..."
          className="w-full sm:w-80"
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
        >
          <option value="">All Account Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="BLOCKED">BLOCKED</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <AdminTableSkeleton rows={8} columns={6} />
        ) : error ? (
          <div className="py-12">
            <AdminErrorState
              title="Failed to load customer directory"
              message="Could not connect to the customer backend endpoint."
              onRetry={() => refetch()}
            />
          </div>
        ) : customers.length === 0 ? (
          <AdminEmptyState
            icon={<Users className="w-8 h-8" />}
            title="No customers found"
            description="Zero customer records match your filter criteria."
          />
        ) : (
          <>
            <AdminTable
              headers={[
                'Customer',
                'Contact Details',
                'Registered Since',
                'Orders Completed',
                'Lifetime Spend',
                'Account Status',
                'Actions',
              ]}
            >
              {customers.map((cust) => (
                <AdminTableRow key={cust.id}>
                  <AdminTableCell className="font-semibold text-slate-900">
                    {cust.name}
                  </AdminTableCell>

                  <AdminTableCell>
                    <div className="text-xs text-slate-800">{cust.email}</div>
                    <div className="text-[11px] text-slate-400">{cust.phone || 'No phone'}</div>
                  </AdminTableCell>

                  <AdminTableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(cust.createdAt).toLocaleDateString()}
                  </AdminTableCell>

                  <AdminTableCell className="text-xs font-semibold text-slate-700">
                    {cust.ordersCount} orders
                  </AdminTableCell>

                  <AdminTableCell className="font-bold text-slate-900">
                    ₹{Number(cust.totalSpent ?? 0).toLocaleString()}
                  </AdminTableCell>

                  <AdminTableCell>
                    <AdminStatusBadge status={cust.status} size="sm" />
                  </AdminTableCell>

                  <AdminTableCell>
                    <AdminButton
                      size="sm"
                      variant={cust.status === 'ACTIVE' ? 'ghost' : 'outline'}
                      onClick={() => setSelectedCustomer(cust)}
                      leftIcon={
                        cust.status === 'ACTIVE' ? (
                          <Ban className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                        )
                      }
                    >
                      {cust.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                    </AdminButton>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>

            <AdminPagination
              currentPage={page}
              totalItems={total}
              pageSize={15}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      {selectedCustomer && (
        <AdminConfirmDialog
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          onConfirm={handleToggleStatus}
          title={
            selectedCustomer.status === 'ACTIVE'
              ? 'Suspend Customer Account'
              : 'Reactivate Customer Account'
          }
          message={
            selectedCustomer.status === 'ACTIVE'
              ? `Are you sure you want to suspend account access for ${selectedCustomer.name} (${selectedCustomer.email})?`
              : `Restore active account access for ${selectedCustomer.name}?`
          }
          confirmLabel={selectedCustomer.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate'}
          isDangerous={selectedCustomer.status === 'ACTIVE'}
          isLoading={statusMutation.isPending}
        />
      )}
    </div>
  );
}
