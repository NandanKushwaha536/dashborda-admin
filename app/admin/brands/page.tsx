'use client';

import { useSearchParams } from 'next/navigation';
import React, { Suspense, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Brand } from '@/lib/api/types';
import { useBrandMutations, useBrands } from '@/lib/hooks/useCatalog';
import { useAuth } from '@/lib/auth/AuthContext';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { errorMessage, formatNumber } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { Card, PageHeader } from '@/components/ui/Layout';
import { FilterBar, SearchInput } from '@/components/ui/Navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Feedback';
import { Button, DeleteAction, EditAction } from '@/components/ui/Button';
import { ConfirmDialog, useToast } from '@/components/ui/Overlay';
import { CatalogEntityDialog } from '@/components/catalog/CatalogEntityDialog';

function BrandsView() {
  const toast = useToast();
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.PRODUCTS_WRITE);
  const { data: brands = [], isLoading, error, refetch } = useBrands();
  const { remove } = useBrandMutations();
  // Opened from the header search with ?search=…
  const initialSearch = useSearchParams().get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const [editing, setEditing] = useState<{ entity: Brand | null } | null>(null);
  const [deleting, setDeleting] = useState<Brand | null>(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? brands.filter((b) => b.name.toLowerCase().includes(term)) : brands;
  }, [brands, search]);

  const nameCell = (brand: Brand) => (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
        {brand.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL
          <img src={brand.logo} alt="" className="h-full w-full object-contain" loading="lazy" />
        ) : (
          <span className="text-[13px] font-semibold text-slate-500">{brand.name.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="font-semibold text-slate-900">{brand.name}</span>
        {brand.website ? <span className="truncate text-[12px] text-slate-500">{brand.website.replace(/^https?:\/\//, '')}</span> : null}
      </div>
    </div>
  );

  const actions = (brand: Brand) =>
    canWrite ? (
      <div className="flex justify-end gap-2">
        <EditAction onClick={() => setEditing({ entity: brand })} />
        <DeleteAction onClick={() => setDeleting(brand)} />
      </div>
    ) : null;

  const status = (brand: Brand) => <Badge tone={brand.status === 'ACTIVE' ? 'green' : 'neutral'}>{brand.status === 'ACTIVE' ? 'Active' : 'Hidden'}</Badge>;

  const columns: Column<Brand>[] = [
    { key: 'name', header: 'Brand', cell: nameCell },
    { key: 'products', header: 'Products', align: 'right', cell: (b) => <span className="tabular">{formatNumber(b.productCount)}</span> },
    { key: 'status', header: 'Status', cell: status },
    { key: 'actions', header: 'Actions', align: 'right', cell: actions },
  ];

  return (
    <>
      <PageHeader
        title="Brands"
        description="Every product belongs to a brand. Hidden brands stay on existing products but can't be picked for new ones."
        actions={
          canWrite ? (
            <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setEditing({ entity: null })}>
              Add brand
            </Button>
          ) : null
        }
      />
      <Card className="overflow-hidden">
        <FilterBar className="border-b border-slate-100">
          <SearchInput className="sm:max-w-sm sm:flex-1" label="Search brands" placeholder="Brand name" value={search} onChange={setSearch} />
        </FilterBar>
        <DataTable
          caption="Brands"
          rows={rows}
          columns={columns}
          getRowId={(b) => b._id}
          loading={isLoading}
          error={error ? errorMessage(error) : null}
          onRetry={() => refetch()}
          minWidth={640}
          empty={{ title: search ? 'No brands match' : 'No brands yet', description: search ? undefined : 'Add the brands you sell.' }}
          mobileCard={(b) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                {nameCell(b)}
                {status(b)}
              </div>
              <span className="text-[13px] text-slate-600">{formatNumber(b.productCount)} products</span>
              {actions(b)}
            </div>
          )}
        />
      </Card>

      <CatalogEntityDialog kind="brand" open={editing !== null} entity={editing?.entity ?? null} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        tone="danger"
        busy={remove.isPending}
        title={`Delete ${deleting?.name ?? 'brand'}?`}
        confirmLabel="Delete"
        message="If products still use this brand, the backend may refuse. Hide it instead to stop new products using it."
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting._id);
            toast.success(`${deleting.name} deleted.`);
            setDeleting(null);
          } catch (err) {
            toast.error(errorMessage(err));
          }
        }}
      />
    </>
  );
}

export default function BrandsPage() {
  return (
    <Restricted permission={PERMISSIONS.PRODUCTS_READ}>
      <Suspense fallback={null}>
        <BrandsView />
      </Suspense>
    </Restricted>
  );
}
