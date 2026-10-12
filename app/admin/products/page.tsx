'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Product } from '@/lib/api/types';
import { useBulkProductDelete, useBulkProductStatus, useProducts } from '@/lib/hooks/useProducts';
import { useBrands, useCategories } from '@/lib/hooks/useCatalog';
import { useDebouncedValue, useUrlParams } from '@/lib/hooks/useUrlState';
import { useAuth } from '@/lib/auth/AuthContext';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { PRODUCT_STATUS } from '@/lib/status';
import { cn, errorMessage, formatINR, formatNumber } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { Card, PageHeader } from '@/components/ui/Layout';
import { FilterBar, Pagination, SearchInput } from '@/components/ui/Navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/Form';
import { Button, ButtonLink, DeleteAction, EditAction } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog, useToast } from '@/components/ui/Overlay';

const PAGE_SIZE = 20;

function Thumb({ product }: { product: Product }) {
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      {product.mainImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URLs of any size
        <img src={product.mainImage} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : null}
    </div>
  );
}

function PriceCell({ product }: { product: Product }) {
  const onSale = product.salePrice > 0 && product.salePrice < product.price;
  return (
    <div className="flex flex-col items-end">
      <span className="tabular font-semibold">{formatINR(onSale ? product.salePrice : product.price)}</span>
      {onSale ? <span className="tabular text-[12px] text-slate-500 line-through">{formatINR(product.price)}</span> : null}
    </div>
  );
}

function StockCell({ product }: { product: Product }) {
  return (
    <span className={cn('tabular font-medium', product.stock <= 0 ? 'text-red-700' : product.stock <= 5 ? 'text-amber-700' : 'text-slate-800')}>
      {formatNumber(product.stock)}
    </span>
  );
}

function ProductsView() {
  const toast = useToast();
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.PRODUCTS_WRITE);
  const [query, setQuery] = useUrlParams(['page', 'search', 'status', 'category', 'brand'] as const);
  const page = Math.max(1, Number(query.page) || 1);
  const [searchText, setSearchText] = useState(query.search);
  const search = useDebouncedValue(searchText);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Products waiting for the delete confirmation: one row, or the bulk selection.
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const bulkStatus = useBulkProductStatus();
  const bulkDelete = useBulkProductDelete();

  React.useEffect(() => {
    if (search !== query.search) setQuery({ search, page: null });
  }, [search, query.search, setQuery]);

  const products = useProducts({ page, limit: PAGE_SIZE, search, status: query.status, category: query.category, brand: query.brand });
  const rows = products.data?.products ?? [];

  const runStatus = async (status: 'ACTIVE' | 'INACTIVE') => {
    try {
      const result = await bulkStatus.mutateAsync({ productIds: [...selected], status });
      toast.success(`${result.updatedCount} product${result.updatedCount === 1 ? '' : 's'} ${status === 'ACTIVE' ? 'activated' : 'hidden'}.`);
      setSelected(new Set());
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'Product',
      cell: (product) => (
        <div className="flex items-center gap-3">
          <Thumb product={product} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link href={`/admin/products/${product._id}`} className="font-medium text-slate-900 hover:text-indigo-700 hover:underline">
              {product.name}
            </Link>
            <span className="font-mono text-[12px] text-slate-500">{product.sku}</span>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', cell: (product) => <span className="text-slate-700">{product.categoryName || '—'}</span> },
    { key: 'brand', header: 'Brand', cell: (product) => <span className="text-slate-700">{product.brandName || '—'}</span> },
    { key: 'price', header: 'Price', align: 'right', cell: (product) => <PriceCell product={product} /> },
    { key: 'stock', header: 'Stock', align: 'right', cell: (product) => <StockCell product={product} /> },
    { key: 'status', header: 'Status', cell: (product) => <StatusBadge map={PRODUCT_STATUS} value={product.status} /> },
    ...(canWrite
      ? [
          {
            key: 'actions',
            header: 'Actions',
            align: 'right' as const,
            cell: (product: Product) => (
              <div className="flex justify-end gap-2">
                <EditAction href={`/admin/products/${product._id}`} />
                <DeleteAction onClick={() => setDeleteIds([product._id])} />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything you sell. Draft products stay hidden until you make them active."
        actions={
          canWrite ? (
            <ButtonLink href="/admin/products/new" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              Add product
            </ButtonLink>
          ) : null
        }
      />
      <Card className="overflow-hidden">
        <FilterBar className="border-b border-slate-100">
          <SearchInput className="sm:flex-1" label="Search products" placeholder="Name or SKU" value={searchText} onChange={setSearchText} />
          <Select
            label="Status"
            containerClassName="sm:w-40"
            value={query.status}
            onChange={(event) => setQuery({ status: event.target.value, page: null })}
            placeholder="All"
            options={Object.entries(PRODUCT_STATUS).map(([value, style]) => ({ value, label: style.label }))}
          />
          <Select
            label="Category"
            containerClassName="sm:w-48"
            value={query.category}
            onChange={(event) => setQuery({ category: event.target.value, page: null })}
            placeholder="All categories"
            options={categories.map((c) => ({ value: c._id, label: c.parentName ? `${c.parentName} › ${c.name}` : c.name }))}
          />
          <Select
            label="Brand"
            containerClassName="sm:w-44"
            value={query.brand}
            onChange={(event) => setQuery({ brand: event.target.value, page: null })}
            placeholder="All brands"
            options={brands.map((b) => ({ value: b._id, label: b.name }))}
          />
        </FilterBar>

        {canWrite && selected.size > 0 ? (
          <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 border-b border-indigo-200 bg-indigo-50 px-4 py-2.5">
            <span className="mr-auto text-sm font-semibold text-indigo-950">{selected.size} selected</span>
            <Button size="sm" variant="soft" loading={bulkStatus.isPending} onClick={() => runStatus('ACTIVE')}>
              Make active
            </Button>
            <Button size="sm" variant="soft" loading={bulkStatus.isPending} onClick={() => runStatus('INACTIVE')}>
              Hide from store
            </Button>
            <DeleteAction onClick={() => setDeleteIds([...selected])} />
          </div>
        ) : null}

        <DataTable
          caption="Products"
          rows={rows}
          columns={columns}
          getRowId={(product) => product._id}
          loading={products.isLoading}
          error={products.error ? errorMessage(products.error) : null}
          onRetry={() => products.refetch()}
          selection={canWrite ? { selected, onChange: setSelected } : undefined}
          empty={{
            title: search || query.status || query.category || query.brand ? 'No products match' : 'No products yet',
            description: search || query.status ? 'Try a different search or filter.' : 'Add your first product to start selling.',
            action: canWrite && !search ? <ButtonLink href="/admin/products/new">Add product</ButtonLink> : undefined,
          }}
          mobileCard={(product, select) => (
            <div className="flex gap-3">
              {select ? <div className="pt-1">{select}</div> : null}
              <Thumb product={product} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link href={`/admin/products/${product._id}`} className="font-semibold text-slate-900">
                  {product.name}
                </Link>
                <span className="font-mono text-[12px] text-slate-500">{product.sku}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge map={PRODUCT_STATUS} value={product.status} />
                  <span className="text-[12.5px] text-slate-600">
                    Stock <StockCell product={product} />
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between gap-2">
                <PriceCell product={product} />
                {canWrite ? (
                  <div className="flex gap-1.5">
                    <EditAction href={`/admin/products/${product._id}`} />
                    <DeleteAction onClick={() => setDeleteIds([product._id])} />
                  </div>
                ) : null}
              </div>
            </div>
          )}
        />
        {products.data && products.data.total > PAGE_SIZE ? (
          <Pagination page={page} pageSize={PAGE_SIZE} total={products.data.total} onPageChange={(next) => setQuery({ page: next })} />
        ) : null}
      </Card>

      <ConfirmDialog
        open={deleteIds.length > 0}
        onClose={() => setDeleteIds([])}
        tone="danger"
        busy={bulkDelete.isPending}
        title={
          deleteIds.length === 1
            ? `Delete ${rows.find((product) => product._id === deleteIds[0])?.name ?? 'this product'}?`
            : `Delete ${deleteIds.length} products?`
        }
        confirmLabel="Delete"
        message="They disappear from the store and the admin. Past orders keep their details. To keep a product but stop selling it, hide it instead."
        onConfirm={async () => {
          try {
            const result = await bulkDelete.mutateAsync(deleteIds);
            toast.success(`${result.deletedCount} deleted.`);
            setSelected((current) => new Set([...current].filter((id) => !deleteIds.includes(id))));
            setDeleteIds([]);
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Restricted permission={PERMISSIONS.PRODUCTS_READ}>
      <Suspense fallback={null}>
        <ProductsView />
      </Suspense>
    </Restricted>
  );
}
