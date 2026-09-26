'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutTemplate, Plus, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardBody } from '@/components/admin/ui/AdminCard';

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Storefront Banners & Content Blocks"
        description="Homepage promotional carousel slides, announcement tickers, and policy pages."
      />

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-700">
        <AlertCircle className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
        <div>
          <span className="font-bold">Storefront CMS Engine:</span> Category banners and brand hero imagery can currently be curated directly within their respective master registries in{' '}
          <Link href="/admin/categories" className="text-blue-600 underline font-semibold">
            Categories
          </Link>{' '}
          and{' '}
          <Link href="/admin/brands" className="text-blue-600 underline font-semibold">
            Brands
          </Link>
          .
        </div>
      </div>

      <AdminCard>
        <AdminCardBody className="py-12">
          <AdminEmptyState
            icon={<LayoutTemplate className="w-6 h-6" />}
            title="No custom storefront content blocks"
            description="Hero carousels, marketing banners, and rich editorial landing pages will synchronize with the storefront frontend here."
            actionLabel="Curate Category Visuals"
            onAction={() => window.location.assign('/admin/categories')}
          />
        </AdminCardBody>
      </AdminCard>
    </div>
  );
}
