'use client';

import { useSearchParams } from 'next/navigation';
import React, { Suspense, useMemo, useState } from 'react';
import { CornerDownRight, Plus } from 'lucide-react';
import type { Category } from '@/lib/api/types';
import { useCategories, useCategoryMutations } from '@/lib/hooks/useCatalog';
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

/** Main categories followed by their sub-categories, so the list reads as a tree. */
function asTree(categories: Category[]): Category[] {
  const mains = categories.filter((c) => !c.parentId);
  const ordered: Category[] = [];
  mains.forEach((main) => {
    ordered.push(main);
    ordered.push(...categories.filter((c) => c.parentId === main._id));
  });
  // Sub-categories whose parent is missing still appear at the end.
  categories.forEach((c) => {
    if (!ordered.includes(c)) ordered.push(c);
  });
  return ordered;
}

function CategoriesView() {
  const toast = useToast();
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.PRODUCTS_WRITE);
  const { data: categories = [], isLoading, error, refetch } = useCategories();
  const { remove } = useCategoryMutations();
  // Opened from the header search with ?search=…
  const initialSearch = useSearchParams().get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const [editing, setEditing] = useState<{ entity: Category | null; parent: string } | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const mains = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const tree = asTree(categories);
    return term ? tree.filter((c) => c.name.toLowerCase().includes(term)) : tree;
  }, [categories, search]);

  const nameCell = (category: Category) => (
    <div className="flex items-center gap-3">
      {category.parentId ? <CornerDownRight className="ml-2 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /> : null}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        {category.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL
          <img src={category.image} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className={category.parentId ? 'font-medium text-slate-800' : 'font-semibold text-slate-900'}>{category.name}</span>
        <span className="text-[12px] text-slate-500">/{category.slug}</span>
      </div>
    </div>
  );

  const actions = (category: Category, full = false) =>
    canWrite ? (
      <div className={full ? 'flex flex-wrap gap-2' : 'flex justify-end gap-2'}>
        {!category.parentId ? (
          <Button size="sm" variant="ghost" onClick={() => setEditing({ entity: null, parent: category._id })}>
            Add sub-category
          </Button>
        ) : null}
        <EditAction onClick={() => setEditing({ entity: category, parent: '' })} />
        <DeleteAction onClick={() => setDeleting(category)} />
      </div>
    ) : null;

  const columns: Column<Category>[] = [
    { key: 'name', header: 'Category', cell: nameCell },
    { key: 'products', header: 'Products', align: 'right', cell: (c) => <span className="tabular">{formatNumber(c.productCount)}</span> },
    { key: 'status', header: 'Status', cell: (c) => <Badge tone={c.status === 'ACTIVE' ? 'green' : 'neutral'}>{c.status === 'ACTIVE' ? 'Active' : 'Hidden'}</Badge> },
    { key: 'actions', header: 'Actions', align: 'right', cell: (c) => actions(c) },
  ];

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group products the way customers browse. Sub-categories sit under a main category."
        actions={
          canWrite ? (
            <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setEditing({ entity: null, parent: '' })}>
              Add category
            </Button>
          ) : null
        }
      />
      <Card className="overflow-hidden">
        <FilterBar className="border-b border-slate-100">
          <SearchInput className="sm:max-w-sm sm:flex-1" label="Search categories" placeholder="Category name" value={search} onChange={setSearch} />
        </FilterBar>
        <DataTable
          caption="Categories"
          rows={rows}
          columns={columns}
          getRowId={(c) => c._id}
          loading={isLoading}
          error={error ? errorMessage(error) : null}
          onRetry={() => refetch()}
          minWidth={640}
          empty={{
            title: search ? 'No categories match' : 'No categories yet',
            description: search ? undefined : 'Add a category before adding products.',
          }}
          mobileCard={(c) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                {nameCell(c)}
                <Badge tone={c.status === 'ACTIVE' ? 'green' : 'neutral'}>{c.status === 'ACTIVE' ? 'Active' : 'Hidden'}</Badge>
              </div>
              <span className="text-[13px] text-slate-600">{formatNumber(c.productCount)} products</span>
              {actions(c, true)}
            </div>
          )}
        />
      </Card>

      <CatalogEntityDialog
        kind="category"
        open={editing !== null}
        entity={editing?.entity ?? null}
        defaultParent={editing?.parent ?? ''}
        parents={mains}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        tone="danger"
        busy={remove.isPending}
        title={`Delete ${deleting?.name ?? 'category'}?`}
        confirmLabel="Delete"
        message="Products in this category will need a new category. If it still has products or sub-categories, the backend may refuse; hide it instead."
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

export default function CategoriesPage() {
  return (
    <Restricted permission={PERMISSIONS.PRODUCTS_READ}>
      <Suspense fallback={null}>
        <CategoriesView />
      </Suspense>
    </Restricted>
  );
}
