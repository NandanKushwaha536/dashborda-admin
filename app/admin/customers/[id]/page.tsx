'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCustomer } from '@/lib/hooks/useCustomers';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { ArrowLeft, User, ShoppingBag, Mail, Phone, Calendar } from 'lucide-react';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const { data: customer, isLoading, error, refetch } = useCustomer(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminSkeleton className="h-8 w-1/3" />
        <AdminSkeleton className="h-64" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="py-12">
        <AdminErrorState
          title="Customer not found"
          message={`Could not load customer account details for ID ${id}.`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={customer.name}
        description={`Registered customer since ${new Date(customer.createdAt).toLocaleDateString()}`}
        breadcrumbs={[
          { label: 'Customers', href: '/admin/customers' },
          { label: customer.name },
        ]}
        actions={
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/customers')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back to Customers
          </AdminButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <AdminCard>
            <AdminCardHeader title="Customer Account Details" />
            <AdminCardBody className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Email Address:</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{customer.email}</p>
                </div>
                <div>
                  <span className="text-slate-400">Phone Number:</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {customer.phone || 'No phone recorded'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Lifetime Transactions:</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {customer.ordersCount} orders
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Total Spend (Settled):</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    ₹{Number(customer.totalSpent ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </AdminCardBody>
          </AdminCard>
        </div>

        <div>
          <AdminCard>
            <AdminCardHeader title="Account Privileges" />
            <AdminCardBody className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Account Status:</span>
                <AdminStatusBadge status={customer.status} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Registered Date:</span>
                <span className="text-slate-700">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </span>
              </div>
            </AdminCardBody>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
