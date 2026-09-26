'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, RotateCcw, Info, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';

export default function AbandonedCartPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['marketing', 'abandoned-cart'],
    queryFn: async () => {
      try {
        const res = await api.get<{ success?: boolean; data?: unknown[] }>('/admin/abandoned-cart');
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    retry: false,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Abandoned Cart Recovery"
        description="Identify uncompleted checkout sessions and trigger automated email or SMS recovery nudges."
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
            <Link href="/admin/customers">
              <AdminButton variant="outline" size="sm" leftIcon={<Users className="w-4 h-4" />}>
                Customer Profiles
              </AdminButton>
            </Link>
            <Link href="/admin/orders">
              <AdminButton variant="primary" size="sm" leftIcon={<ShoppingCart className="w-4 h-4" />}>
                Orders Ledger
              </AdminButton>
            </Link>
          </div>
        }
      />

      {/* Backend Status Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-bold">Backend Architecture Status:</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800 border border-amber-300">
              Abandoned Cart backend API = MISSING
            </span>
          </div>
          <p>
            Dedicated cart abandonment tracking and scheduled recovery notifications (<code className="font-mono">/api/v1/abandoned-cart</code> or <code className="font-mono">/api/v1/admin/abandoned-cart</code>)
            are not currently mounted in the backend routing architecture.
          </p>
          <p className="text-amber-800/80">
            Active customer checkout sessions and inventory reservations are captured in the Orders ledger and Inventory module.
            In compliance with strict API contract directives, no mock abandoned cart records or synthetic customers are generated.
          </p>
        </div>
      </div>

      <AdminCard>
        <AdminCardBody className="py-12">
          <AdminEmptyState
            icon={<ShoppingCart className="w-6 h-6" />}
            title="Abandoned Cart backend support is not available"
            description="Incomplete checkouts, drop-off analytics, and automated discount recovery emails will be reported here when backend tracking is enabled."
            actionLabel="View Customer Orders"
            onAction={() => window.location.assign('/admin/orders')}
          />
        </AdminCardBody>
      </AdminCard>
    </div>
  );
}
