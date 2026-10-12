'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Printer } from 'lucide-react';
import type { Order, OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/api/types';
import { useOrderStatusCounts, useOrders, useUpdateOrderStatus } from '@/lib/hooks/useOrders';
import { useDebouncedValue, useUrlParams } from '@/lib/hooks/useUrlState';
import { downloadReportCsv } from '@/lib/hooks/useReports';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { ORDER_STAGE_TABS, ORDER_STATUS, PAYMENT_STATUS, nextStepFor, paymentMethodLabel } from '@/lib/status';
import { errorMessage, formatDateTime, formatINR } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { Card, PageHeader, StatTile } from '@/components/ui/Layout';
import { FilterBar, Pagination, SearchInput, Tabs, type TabItem } from '@/components/ui/Navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/Form';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Overlay';
import { NextStepButton } from '@/components/orders/NextStepButton';
import { useAuth } from '@/lib/auth/AuthContext';

const PAGE_SIZE = 20;
type StageFilter = OrderStatus | 'ALL';

const QUEUE: Array<{ status: OrderStatus; label: string; hint: string }> = [
  { status: 'PENDING', label: 'To confirm', hint: 'Check payment, then confirm' },
  { status: 'CONFIRMED', label: 'To pick', hint: 'Print the pick list' },
  { status: 'PROCESSING', label: 'To pack', hint: 'Pack and print slips' },
  { status: 'PACKED', label: 'To ship', hint: 'Hand over to courier' },
];

function itemCount(order: Order) {
  return order.items.reduce((sum, item) => sum + item.quantity - item.cancelledQuantity, 0);
}

function PaymentCell({ order }: { order: Order }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <StatusBadge map={PAYMENT_STATUS} value={order.paymentStatus} />
      <span className="text-[12px] text-slate-500">{paymentMethodLabel(order.paymentMethod)}</span>
    </div>
  );
}

function OrdersView() {
  const { can } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useUrlParams(['stage', 'page', 'search', 'payment', 'method'] as const);
  const stage = (query.stage || 'ALL') as StageFilter;
  const page = Math.max(1, Number(query.page) || 1);
  const [searchText, setSearchText] = useState(query.search);
  const search = useDebouncedValue(searchText);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const bulkStatus = useUpdateOrderStatus();
  const [bulkBusy, setBulkBusy] = useState(false);

  const counts = useOrderStatusCounts();
  const orders = useOrders({
    page,
    limit: PAGE_SIZE,
    status: stage === 'ALL' ? '' : stage,
    paymentStatus: query.payment as PaymentStatus | '',
    paymentMethod: query.method as PaymentMethod | '',
    search,
  });

  // Keep the URL in step with the debounced search box.
  React.useEffect(() => {
    if (search !== query.search) setQuery({ search, page: null });
  }, [search, query.search, setQuery]);

  const totalOrders = useMemo(() => Object.values(counts.data ?? {}).reduce((sum, n) => sum + (n ?? 0), 0), [counts.data]);
  const tabs: TabItem<StageFilter>[] = [
    { value: 'ALL', label: 'All', count: counts.data ? totalOrders : undefined },
    ...ORDER_STAGE_TABS.map((status) => ({
      value: status as StageFilter,
      label: status === 'RETURN_REQUESTED' ? 'Returns' : ORDER_STATUS[status].label,
      count: counts.data ? counts.data[status] ?? 0 : undefined,
    })),
  ];

  const setStage = (value: StageFilter) => {
    setSelected(new Set());
    setQuery({ stage: value === 'ALL' ? null : value, page: null });
  };

  const rows = orders.data?.orders ?? [];
  const selectedOrders = rows.filter((order) => selected.has(order.id));
  const printHref = (type: 'pick' | 'pack') => `/print/orders?type=${type}&ids=${selectedOrders.map((o) => o.id).join(',')}`;

  // Bulk move is offered only when every selected order is at the same simple step.
  const bulkStep = (() => {
    if (selectedOrders.length === 0 || !can(PERMISSIONS.ORDERS_WRITE)) return null;
    const steps = selectedOrders.map((order) => nextStepFor(order));
    const first = steps[0];
    if (!first || first.kind !== 'status') return null;
    return steps.every((step) => step?.kind === 'status' && step.to === first.to) ? first : null;
  })();

  const runBulk = async () => {
    if (!bulkStep || bulkStep.kind !== 'status') return;
    setBulkBusy(true);
    let done = 0;
    const failures: string[] = [];
    for (const order of selectedOrders) {
      try {
        await bulkStatus.mutateAsync({ id: order.id, status: bulkStep.to });
        done += 1;
      } catch (error) {
        failures.push(`${order.orderNumber}: ${errorMessage(error)}`);
      }
    }
    setBulkBusy(false);
    setSelected(new Set());
    if (done) toast.success(`${done} order${done === 1 ? '' : 's'} moved to ${ORDER_STATUS[bulkStep.to].label.toLowerCase()}.`);
    if (failures.length) toast.error(failures[0]);
  };

  const exportCsv = async () => {
    try {
      await downloadReportCsv(ENDPOINTS.reports.csv, { type: 'orders' }, 'orders.csv');
    } catch (error) {
      toast.error(errorMessage(error, 'The export could not be downloaded.'));
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'order',
      header: 'Order',
      cell: (order) => (
        <div className="flex flex-col gap-0.5">
          <Link href={`/admin/orders/${order.id}`} className="font-mono text-[13px] font-medium text-indigo-700 hover:underline">
            {order.orderNumber}
          </Link>
          <span className="text-[12px] text-slate-500">{formatDateTime(order.placedAt)}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (order) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-slate-900">{order.customer.name}</span>
          <span className="text-[12px] text-slate-500">
            {[order.shippingAddress.city, order.shippingAddress.postalCode].filter(Boolean).join(' ') || order.customer.phone}
          </span>
        </div>
      ),
    },
    { key: 'items', header: 'Items', cell: (order) => <span className="tabular text-slate-700">{itemCount(order)}</span> },
    { key: 'total', header: 'Total', align: 'right', cell: (order) => <span className="tabular font-semibold">{formatINR(order.totalAmount)}</span> },
    { key: 'payment', header: 'Payment', cell: (order) => <PaymentCell order={order} /> },
    { key: 'stage', header: 'Stage', cell: (order) => <StatusBadge map={ORDER_STATUS} value={order.status} /> },
    { key: 'next', header: 'Next step', align: 'right', cell: (order) => <NextStepButton order={order} /> },
  ];

  return (
    <>
      <PageHeader
        title="Orders"
        description="Move every order from payment to doorstep. Each order shows its one next step."
        actions={
          <Button variant="secondary" icon={<Download className="h-4 w-4" aria-hidden="true" />} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />

      <section aria-label="Work queue" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUEUE.map((item) => (
          <StatTile
            key={item.status}
            label={item.label}
            value={counts.data ? counts.data[item.status] ?? 0 : '—'}
            hint={<span className="hidden sm:inline">{item.hint}</span>}
            active={stage === item.status}
            onClick={() => setStage(item.status)}
          />
        ))}
      </section>

      <Card className="overflow-hidden">
        <div className="pt-3 md:pt-0">
          <Tabs label="Order stage" items={tabs} value={stage} onChange={setStage} />
        </div>
        <FilterBar className="border-b border-slate-100">
          <SearchInput
            className="sm:flex-1"
            label="Search orders"
            placeholder="Order number or phone"
            value={searchText}
            onChange={setSearchText}
          />
          <Select
            label="Payment"
            containerClassName="sm:w-44"
            value={query.payment}
            onChange={(event) => setQuery({ payment: event.target.value, page: null })}
            placeholder="All payments"
            options={Object.entries(PAYMENT_STATUS).map(([value, style]) => ({ value, label: style.label }))}
          />
          <Select
            label="Method"
            containerClassName="sm:w-44"
            value={query.method}
            onChange={(event) => setQuery({ method: event.target.value, page: null })}
            placeholder="All methods"
            options={[
              { value: 'ONLINE', label: 'Online' },
              { value: 'COD', label: 'Cash on delivery' },
            ]}
          />
        </FilterBar>

        {selected.size > 0 ? (
          <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 border-b border-indigo-200 bg-indigo-50 px-4 py-2.5">
            <span className="mr-auto text-sm font-semibold text-indigo-950">{selected.size} selected</span>
            {bulkStep && bulkStep.kind === 'status' ? (
              <Button size="sm" onClick={runBulk} loading={bulkBusy}>
                {bulkStep.label} ({selected.size})
              </Button>
            ) : null}
            <ButtonLink href={printHref('pick')} target="_blank" variant="soft" size="sm" icon={<Printer className="h-4 w-4" aria-hidden="true" />}>
              Pick list
            </ButtonLink>
            <ButtonLink href={printHref('pack')} target="_blank" variant="soft" size="sm" icon={<Printer className="h-4 w-4" aria-hidden="true" />}>
              Packing slips
            </ButtonLink>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        ) : null}

        <DataTable
          caption="Orders"
          rows={rows}
          columns={columns}
          getRowId={(order) => order.id}
          loading={orders.isLoading}
          error={orders.error ? errorMessage(orders.error) : null}
          onRetry={() => orders.refetch()}
          selection={{ selected, onChange: setSelected }}
          empty={{
            title: stage === 'ALL' && !search ? 'No orders yet' : 'Nothing here',
            description: stage === 'ALL' && !search ? 'New orders from the store show up here.' : 'No orders match this stage or search.',
          }}
          mobileCard={(order, select) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {select}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Link href={`/admin/orders/${order.id}`} className="font-mono text-[14px] font-medium text-indigo-700">
                    {order.orderNumber}
                  </Link>
                  <span className="text-[12.5px] text-slate-500">{formatDateTime(order.placedAt)}</span>
                </div>
                <StatusBadge map={ORDER_STATUS} value={order.status} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold text-slate-900">{order.customer.name}</span>
                <span className="text-[13px] text-slate-500">
                  {[order.shippingAddress.city, order.shippingAddress.postalCode].filter(Boolean).join(' ')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="tabular text-base font-bold">
                  {formatINR(order.totalAmount)}{' '}
                  <span className="text-[13px] font-normal text-slate-500">· {itemCount(order)} items</span>
                </span>
                <PaymentCell order={order} />
              </div>
              <NextStepButton order={order} size="md" fullWidth />
            </div>
          )}
        />
        {orders.data && orders.data.total > PAGE_SIZE ? (
          <Pagination page={page} pageSize={PAGE_SIZE} total={orders.data.total} onPageChange={(next) => setQuery({ page: next })} />
        ) : null}
      </Card>
    </>
  );
}

export default function OrdersPage() {
  return (
    <Restricted permission={PERMISSIONS.ORDERS_READ}>
      <Suspense fallback={null}>
        <OrdersView />
      </Suspense>
    </Restricted>
  );
}
