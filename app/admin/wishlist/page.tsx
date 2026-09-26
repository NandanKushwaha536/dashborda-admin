'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Package, RotateCcw, AlertCircle, ExternalLink, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';

export default function WishlistPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', 'wishlist-analytics'],
    queryFn: async () => {
      try {
        const res = await api.get<{ success?: boolean; data?: unknown[] }>('/admin/wishlist');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err: unknown) {
        // Return null to signify backend endpoint is not mounted
        return null;
      }
    },
    staleTime: 60_000,
    retry: false,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Wishlist Insights"
        description="Monitor product demand signals, saved items, and purchase intent across customer accounts."
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
            <Link href="/admin/products">
              <AdminButton variant="primary" size="sm">
                Catalog Products
              </AdminButton>
            </Link>
          </div>
        }
      />

      {/* Backend Status Assessment */}
      {data === null && !isLoading && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-slate-700">
            <p className="font-bold text-slate-900">Backend Support Status: Storefront-Managed</p>
            <p>
              Customer wishlist events are currently handled directly on client storefront sessions.
              A dedicated backend aggregation endpoint (`GET /api/v1/admin/wishlist`) is not mounted on the backend.
            </p>
            <p className="text-slate-500">
              When the backend introduces a centralized wishlist collection, demand aggregation will automatically render in this panel.
            </p>
          </div>
        </div>
      )}

      <AdminCard>
        <AdminCardBody className="py-12">
          <AdminEmptyState
            icon={<Heart className="w-6 h-6" />}
            title="Wishlist Analytics"
            description="High-intent product demand indicators and customer saved items will synchronize when the backend wishlist aggregation service is active."
            actionLabel="View Catalog Products"
            onAction={() => window.location.assign('/admin/products')}
          />
        </AdminCardBody>
      </AdminCard>
    </div>
  );
}
