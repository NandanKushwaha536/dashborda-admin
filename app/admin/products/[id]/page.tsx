'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProduct } from '@/lib/hooks/useProducts';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { ArrowLeft, Package, Tag, ShieldCheck } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const { data: product, isLoading, error, refetch } = useProduct(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminSkeleton className="h-8 w-1/3" />
        <AdminSkeleton className="h-64" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-12">
        <AdminErrorState
          title="Product not found"
          message={`Could not load product with ID ${id}.`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={product.name}
        description={`SKU: ${product.sku}`}
        breadcrumbs={[
          { label: 'Products', href: '/admin/products' },
          { label: product.sku },
        ]}
        actions={
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/products')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back to Products
          </AdminButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <AdminCard>
            <AdminCardHeader title="Product Details" />
            <AdminCardBody className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Base Price:</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    ₹{product.price.toLocaleString()}
                  </p>
                </div>
                {product.salePrice > 0 && (
                  <div>
                    <span className="text-slate-400">Sale Price:</span>
                    <p className="text-base font-bold text-teal-600 mt-0.5">
                      ₹{product.salePrice.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Description:</span>
                <p className="text-slate-700 leading-relaxed">
                  {product.description || product.shortDescription || 'No description provided.'}
                </p>
              </div>
            </AdminCardBody>
          </AdminCard>
        </div>

        <div>
          <AdminCard>
            <AdminCardHeader title="Catalog Metadata" />
            <AdminCardBody className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status:</span>
                <AdminStatusBadge status={product.status} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Stock Count:</span>
                <span className="font-semibold text-slate-800">{product.stock} units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Category Ref:</span>
                <span className="font-mono text-[11px] text-slate-600 truncate max-w-[140px]">
                  {product.category}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Brand Ref:</span>
                <span className="font-mono text-[11px] text-slate-600 truncate max-w-[140px]">
                  {product.brand}
                </span>
              </div>
            </AdminCardBody>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
