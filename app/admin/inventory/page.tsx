'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import type { InventoryItem } from '@/lib/api/types';
import { useAdjustStock, useInventory } from '@/lib/hooks/useInventory';
import { useDebouncedValue, useUrlParams } from '@/lib/hooks/useUrlState';
import { useAuth } from '@/lib/auth/AuthContext';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { STOCK_STATUS } from '@/lib/status';
import { cn, errorMessage, formatNumber } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { Card, PageHeader } from '@/components/ui/Layout';
import { FilterBar, Pagination, SearchInput, Tabs } from '@/components/ui/Navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { FormError, Input, SegmentedControl } from '@/components/ui/Form';
import { Modal, useToast } from '@/components/ui/Overlay';

const PAGE_SIZE = 25;
type Mode = 'add' | 'remove' | 'count';
type View = 'all' | 'low' | 'out';

function AdjustDialog({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const toast = useToast();
  const adjust = useAdjustStock();
  const [mode, setMode] = useState<Mode>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const value = Number(amount);
  const valid = amount.trim() !== '' && Number.isInteger(value) && (mode === 'count' ? value >= 0 : value > 0);
  const result = !valid ? null : mode === 'add' ? item.available + value : mode === 'remove' ? item.available - value : value;

  const save = async () => {
    setError(null);
    if (!valid) return setError(mode === 'count' ? 'Enter the counted quantity.' : 'Enter how many units.');
    if (result !== null && result < 0) return setError('Stock cannot go below zero.');
    if (reason.trim().length < 2) return setError('Write a short reason, e.g. "Received from supplier".');
    if (!password) return setError('Enter your password to confirm.');
    try {
      await adjust.mutateAsync({
        productId: item.productId,
        password,
        reason: reason.trim(),
        ...(mode === 'count' ? { physicalCount: value } : { quantity: mode === 'add' ? value : -value }),
      });
      toast.success(`${item.productName}: stock is now ${formatNumber(result ?? 0)}.`);
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Stock could not be changed.'));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      busy={adjust.isPending}
      title="Change stock"
      description={`${item.productName} · now ${formatNumber(item.available)} in stock`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={adjust.isPending}>
            Cancel
          </Button>
          <Button onClick={save} loading={adjust.isPending}>
            Save stock
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormError message={error} />
        <SegmentedControl<Mode>
          label="Type of change"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'add', label: 'Received' },
            { value: 'remove', label: 'Remove' },
            { value: 'count', label: 'Set count' },
          ]}
        />
        <Input
          label={mode === 'count' ? 'Counted quantity' : mode === 'add' ? 'Units received' : 'Units to remove'}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          hint={result !== null ? `New stock: ${formatNumber(result)}` : undefined}
        />
        <Input
          label="Reason"
          required
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={mode === 'remove' ? 'Damaged in storage' : mode === 'count' ? 'Monthly stock count' : 'Received from supplier'}
        />
        <Input
          label="Your password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint="Stock changes need your password again."
        />
      </div>
    </Modal>
  );
}

function InventoryView() {
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.INVENTORY_WRITE);
  const [query, setQuery] = useUrlParams(['view', 'page', 'search'] as const);
  const view = (query.view || 'all') as View;
  const page = Math.max(1, Number(query.page) || 1);
  const [searchText, setSearchText] = useState(query.search);
  const search = useDebouncedValue(searchText);
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);

  React.useEffect(() => {
    if (search !== query.search) setQuery({ search, page: null });
  }, [search, query.search, setQuery]);

  const inventory = useInventory({ page, limit: PAGE_SIZE, search, threshold: view === 'low' ? 5 : view === 'out' ? 0 : undefined });
  const rows = inventory.data?.items ?? [];

  const stock = (item: InventoryItem) => (
    <span className={cn('tabular text-base font-semibold', item.status === 'OUT_OF_STOCK' ? 'text-red-700' : item.status === 'LOW_STOCK' ? 'text-amber-700' : 'text-slate-900')}>
      {formatNumber(item.available)}
    </span>
  );
  const adjustButton = (item: InventoryItem, full = false) =>
    canWrite ? (
      <Button size="sm" variant="secondary" className={full ? 'w-full' : undefined} onClick={() => setAdjusting(item)}>
        Change stock
      </Button>
    ) : null;

  const columns: Column<InventoryItem>[] = [
    {
      key: 'product',
      header: 'Product',
      cell: (item) => (
        <Link href={`/admin/products/${item.productId}`} className="font-medium text-slate-900 hover:text-indigo-700 hover:underline">
          {item.productName}
        </Link>
      ),
    },
    { key: 'sku', header: 'SKU', cell: (item) => <span className="font-mono text-[13px] text-slate-600">{item.sku}</span> },
    { key: 'stock', header: 'In stock', align: 'right', cell: stock },
    { key: 'status', header: 'Status', cell: (item) => <StatusBadge map={STOCK_STATUS} value={item.status} /> },
    { key: 'adjust', header: <span className="sr-only">Change</span>, align: 'right', cell: (item) => adjustButton(item) },
  ];

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock on hand for every published product. Low stock means 5 units or fewer."
      />
      <Card className="overflow-hidden">
        <div className="pt-3 md:pt-0">
          <Tabs<View>
            label="Stock level"
            value={view}
            onChange={(value) => setQuery({ view: value === 'all' ? null : value, page: null })}
            items={[
              { value: 'all', label: 'All products' },
              { value: 'low', label: 'Low stock' },
              { value: 'out', label: 'Out of stock' },
            ]}
          />
        </div>
        <FilterBar className="border-b border-slate-100">
          <SearchInput className="sm:max-w-sm sm:flex-1" label="Search stock" placeholder="Product name or SKU" value={searchText} onChange={setSearchText} />
        </FilterBar>
        <DataTable
          caption="Inventory"
          rows={rows}
          columns={columns}
          getRowId={(item) => item._id}
          loading={inventory.isLoading}
          error={inventory.error ? errorMessage(inventory.error) : null}
          onRetry={() => inventory.refetch()}
          minWidth={680}
          empty={{ title: view === 'all' ? 'No published products' : 'Nothing here', description: view === 'all' ? 'Products appear here once they are not drafts.' : 'Every product has enough stock.' }}
          mobileCard={(item) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-semibold text-slate-900">{item.productName}</span>
                  <span className="font-mono text-[12px] text-slate-500">{item.sku}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {stock(item)}
                  <StatusBadge map={STOCK_STATUS} value={item.status} />
                </div>
              </div>
              {adjustButton(item, true)}
            </div>
          )}
        />
        {inventory.data && inventory.data.total > PAGE_SIZE ? (
          <Pagination page={page} pageSize={PAGE_SIZE} total={inventory.data.total} onPageChange={(next) => setQuery({ page: next })} />
        ) : null}
      </Card>
      {adjusting ? <AdjustDialog item={adjusting} onClose={() => setAdjusting(null)} /> : null}
    </>
  );
}

export default function InventoryPage() {
  return (
    <Restricted permission={PERMISSIONS.INVENTORY_READ}>
      <Suspense fallback={null}>
        <InventoryView />
      </Suspense>
    </Restricted>
  );
}
