'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, RotateCcw, Info, BadgePercent, Flame } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';

export default function FlashSalesPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['marketing', 'flash-sales'],
    queryFn: async () => {
      try {
        const res = await api.get<{ success?: boolean; data?: unknown[] }>('/admin/flash-sales');
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
        title="Flash Sales & Lightning Deals"
        description="Time-restricted promotional events with limited inventory allocation and countdown clocks."
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
              <AdminButton variant="outline" size="sm" leftIcon={<BadgePercent className="w-4 h-4" />}>
                Coupons
              </AdminButton>
            </Link>
            <Link href="/admin/offers">
              <AdminButton variant="primary" size="sm" leftIcon={<Flame className="w-4 h-4" />}>
                Promotional Offers
              </AdminButton>
            </Link>
          </div>
        }
      />

      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-bold">Backend Architecture Status:</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800 border border-amber-300">
              Flash Sale backend API = MISSING
            </span>
          </div>
          <p>
            Dedicated flash sale countdown allocation endpoints (<code className="font-mono">/api/v1/flash-sales</code> or <code className="font-mono">/api/v1/admin/flash-sales</code>) are not provisioned in the backend routing architecture.
          </p>
          <p className="text-amber-800/80">
            You can immediately configure time-restricted percentage or flat discounts with scheduled start and end dates via the{' '}
            <Link href="/admin/coupons" className="text-amber-900 font-semibold underline">
              Coupons Registry
            </Link>
            . No mock flash sales or artificial counters are generated.
          </p>
        </div>
      </div>

      <AdminCard>
        <AdminCardBody className="py-12">
          <AdminEmptyState
            icon={<Zap className="w-6 h-6" />}
            title="Flash Sales Engine"
            description="High-velocity lightning deals and countdown timers will synchronize here once dedicated flash sale backend routes are provisioned."
            actionLabel="Configure Promotional Offers"
            onAction={() => window.location.assign('/admin/offers')}
          />
        </AdminCardBody>
      </AdminCard>
    </div>
  );
}
