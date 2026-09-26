'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useProducts, useDeleteProduct, useBulkProductStatus, useBulkProductDelete } from '@/lib/hooks/useProducts';
import { useCategories, useBrands } from '@/lib/hooks/useCatalog';
import { Product } from '@/lib/api/types';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminSearchBar } from '@/components/admin/ui/AdminSearchBar';
import { AdminFilterBar } from '@/components/admin/ui/AdminFilterBar';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminPagination } from '@/components/admin/ui/AdminPagination';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { ProductFormModal } from '@/components/admin/products/ProductFormModal';
import { ProductBulkToolbar } from '@/components/admin/products/ProductBulkToolbar';
import { Plus, Edit2, Trash2, Package, ExternalLink } from 'lucide-react';

function displayEntityName(value: unknown, fallback = '—'): string {
  if (typeof value === 'string') return value || fallback;
  if (value && typeof value === 'object') {
    const obj = value as { name?: unknown };
    return typeof obj.name === 'string' && obj.name ? obj.name : fallback;
  }
  return fallback;
}

function getProductImage(product: Product): string | null {
  const value = product as Product & {
    thumbnail?: unknown;
    image?: unknown;
    imageUrl?: unknown;
    images?: unknown;
    thumbnailUrl?: unknown;
  };

  const candidates: unknown[] = [
    value.thumbnail,
    value.image,
    value.imageUrl,
    value.thumbnailUrl,
    Array.isArray(value.images) ? value.images[0] : null,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (candidate && typeof candidate === 'object') {
      const obj = candidate as { url?: unknown; src?: unknown; secure_url?: unknown };
      const url = obj.url ?? obj.src ?? obj.secure_url;
      if (typeof url === 'string' && url.trim()) return url.trim();
    }
  }

  return null;
}

function getProductSlug(product: Product): string {
  const value = product as Product & { slug?: unknown };
  return typeof value.slug === 'string' && value.slug.trim() ? value.slug.trim() : product._id;
}

function getStorefrontUrl(product: Product): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_STORE_FRONTEND_URL?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  return `${baseUrl}/products/${encodeURIComponent(getProductSlug(product))}`;
}


export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const { data, isLoading, error, refetch } = useProducts({
    page,
    limit: 15,
    search,
    category: categoryFilter,
    brand: brandFilter,
    status: statusFilter,
  });

  const deleteMutation = useDeleteProduct();
  const bulkStatusMutation = useBulkProductStatus();
  const bulkDeleteMutation = useBulkProductDelete();

  const products = data?.products || [];
  const total = data?.total || 0;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  const handleBulkStatus = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    await bulkStatusMutation.mutateAsync({ productIds: selectedIds, status: newStatus });
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleteConfirmOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    await bulkDeleteMutation.mutateAsync(selectedIds);
    setSelectedIds([]);
    setIsBulkDeleteConfirmOpen(false);
  };

  const handleExportCSV = () => {
    const selectedProducts = products.filter((p) => selectedIds.includes(p._id));
    const header = 'ID,SKU,Name,Price,Stock,Status\n';
    const rows = selectedProducts
      .map((p) => `"${p._id}","${p.sku}","${p.name.replace(/"/g, '""')}",${p.price},${p.stock},"${p.status}"`)
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `products-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSingle = async () => {
    if (!deletingProduct) return;
    await deleteMutation.mutateAsync(deletingProduct._id);
    setDeletingProduct(null);
  };

  const hasActiveFilters = Boolean(search || categoryFilter || brandFilter || statusFilter);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Product Catalog"
        description="Manage master catalog items, SKU mapping, pricing, and stock status."
        actions={
          <AdminButton
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Product
          </AdminButton>
        }
      />

      {/* Filter toolbar */}
      <AdminFilterBar
        hasActiveFilters={hasActiveFilters}
        onReset={() => {
          setSearch('');
          setCategoryFilter('');
          setBrandFilter('');
          setStatusFilter('');
          setPage(1);
        }}
      >
        <AdminSearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by product name or SKU..."
          className="w-full sm:w-64"
        />

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={brandFilter}
          onChange={(e) => {
            setBrandFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DRAFT">DRAFT</option>
          <option value="PENDING_REVIEW">PENDING REVIEW</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="OUT_OF_STOCK">OUT OF STOCK</option>
        </select>
      </AdminFilterBar>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <AdminTableSkeleton rows={8} columns={7} />
        ) : error ? (
          <div className="py-12">
            <AdminErrorState
              title="Failed to load product catalog"
              message="Could not communicate with the product endpoint."
              onRetry={() => refetch()}
            />
          </div>
        ) : products.length === 0 ? (
          <AdminEmptyState
            icon={<Package className="w-8 h-8" />}
            title="No products found"
            description={
              hasActiveFilters
                ? 'No catalog items match your search filters.'
                : 'No products have been created in the catalog yet.'
            }
            actionLabel="Create First Product"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <>
            <AdminTable
              className="overflow-visible"
              headers={[
                <input
                  key="select-all"
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />,
                'Product Name',
                'SKU',
                'Category',
                'Brand',
                'Price (₹)',
                'Stock Units',
                'Catalog Status',
                'Actions',
              ]}
            >
              {products.map((product) => {
                const isSelected = selectedIds.includes(product._id);
                return (
                  <AdminTableRow
                    key={product._id}
                    className={isSelected ? 'bg-blue-50/40' : undefined}
                  >
                    <AdminTableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(product._id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </AdminTableCell>

                    <AdminTableCell>
                      {(() => {
                        const imageUrl = getProductImage(product);
                        const storefrontUrl = getStorefrontUrl(product);

                        return (
                          <div className="flex items-center gap-3 min-w-[300px]">
                            <div className="min-w-0 flex-1">
                              <a
                                href={storefrontUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/name inline-flex max-w-full items-center gap-1.5"
                                title="Open product on storefront"
                              >
                                <span className="truncate font-medium text-slate-900 group-hover/name:text-blue-600 group-hover/name:underline">
                                  {product.name}
                                </span>
                                <ExternalLink className="h-3 w-3 shrink-0 text-slate-400 opacity-0 transition-opacity group-hover/name:opacity-100" />
                              </a>

                              {product.variants && product.variants.length > 0 && (
                                <span className="block text-[11px] text-slate-400">
                                  {product.variants.length} variants
                                </span>
                              )}
                            </div>

                            <a
                              href={storefrontUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative block h-11 w-11 shrink-0 overflow-visible rounded-lg"
                              title="Open product on storefront"
                            >
                              <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition-all duration-200 group-hover:z-50 group-hover:scale-[2.4] group-hover:shadow-xl">
                                {imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={product.name || 'Product'}
                                    fill
                                    sizes="44px"
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                                    <Package className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                            </a>
                          </div>
                        );
                      })()}
                    </AdminTableCell>

                    <AdminTableCell className="font-semibold text-slate-800 text-xs">
                      {product.sku}
                    </AdminTableCell>

                    <AdminTableCell className="text-xs text-slate-600">
                      {product.categoryName || displayEntityName(product.category)}
                    </AdminTableCell>

                    <AdminTableCell className="text-xs text-slate-600">
                      {product.brandName || displayEntityName(product.brand)}
                    </AdminTableCell>

                    <AdminTableCell className="font-semibold text-slate-900">
                      ₹{Number(product.price ?? 0).toLocaleString()}
                      {product.salePrice > 0 && (
                        <span className="block text-[11px] text-teal-600 font-normal">
                          Sale: ₹{Number(product.salePrice ?? 0).toLocaleString()}
                        </span>
                      )}
                    </AdminTableCell>

                    <AdminTableCell>
                      <span
                        className={`font-semibold text-xs ${
                          product.stock <= 5 ? 'text-amber-600' : 'text-slate-800'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </AdminTableCell>

                    <AdminTableCell>
                      <AdminStatusBadge status={product.status} size="sm" />
                    </AdminTableCell>

                    <AdminTableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })}
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

      {/* Bulk actions floating toolbar */}
      <ProductBulkToolbar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onUpdateStatus={handleBulkStatus}
        onDeleteSelected={handleBulkDelete}
        onExportSelected={handleExportCSV}
        isLoading={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
      />

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || editingProduct) && (
        <ProductFormModal
          isOpen={isCreateModalOpen || Boolean(editingProduct)}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingProduct(null);
          }}
          product={editingProduct}
        />
      )}

      {/* Delete Confirmation */}
      {deletingProduct && (
        <AdminConfirmDialog
          isOpen={Boolean(deletingProduct)}
          onClose={() => setDeletingProduct(null)}
          onConfirm={handleDeleteSingle}
          title="Delete Product"
          message={`Are you sure you want to delete "${deletingProduct.name}" (${deletingProduct.sku})? This action cannot be undone.`}
          confirmLabel="Delete Product"
          isDangerous
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Bulk Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Selected Products"
        message={`Are you sure you want to permanently delete ${selectedIds.length} selected products? This action cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.length} Products`}
        isDangerous
        isLoading={bulkDeleteMutation.isPending}
      />
    </div>
  );
}
