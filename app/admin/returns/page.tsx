'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRefundReturn, useReturns, useUpdateReturnStatus, type ReturnRequest, type ReturnStatus } from '@/lib/hooks/useReturns';
import { useUrlParams } from '@/lib/hooks/useUrlState';
import { useAuth } from '@/lib/auth/AuthContext';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { RETURN_STATUS } from '@/lib/status';
import { errorMessage, formatDateTime } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { Card, PageHeader } from '@/components/ui/Layout';
import { FilterBar, Pagination, SearchInput, Tabs, type TabItem } from '@/components/ui/Navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { FormError, Input, Textarea } from '@/components/ui/Form';
import { Modal, useToast } from '@/components/ui/Overlay';
import { Notice } from '@/components/ui/Feedback';

const PAGE_SIZE = 20;
type Filter = ReturnStatus | 'ALL';

const TABS: Array<{ value: Filter; label: string }> = [
  { value: 'RETURN_REQUESTED', label: 'Requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'REFUND_PROCESSING', label: 'Refunding' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ALL', label: 'All' },
];

const isCod = (request: ReturnRequest) => request.order.paymentMethod === 'COD';

function RefundDialog({ request, onClose }: { request: ReturnRequest; onClose: () => void }) {
  const toast = useToast();
  const refund = useRefundReturn();
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const submit = async () => {
    if (!password) return;
    try {
      await refund.mutateAsync({ id: request.id, password, reason });
      toast.success(`Refund started for ${request.order.orderNumber}.`);
      onClose();
    } catch {
      // shown below
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      busy={refund.isPending}
      title={`Refund ${request.order.orderNumber}`}
      description="The money goes back to the customer's original online payment."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={refund.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={refund.isPending} disabled={!password}>
            Confirm refund
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormError message={refund.error ? errorMessage(refund.error) : null} />
        <Textarea label="Reason (optional)" rows={2} value={reason} onChange={(event) => setReason(event.target.value)} />
        <Input
          label="Your password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint="Refunds need your password again, for safety."
        />
      </div>
    </Modal>
  );
}

function RejectDialog({ request, onClose }: { request: ReturnRequest; onClose: () => void }) {
  const toast = useToast();
  const update = useUpdateReturnStatus();
  const [note, setNote] = useState('');
  return (
    <Modal
      open
      onClose={onClose}
      busy={update.isPending}
      title={`Reject return for ${request.order.orderNumber}?`}
      description="The customer is told the return was not accepted."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={update.isPending}
            disabled={note.trim().length < 3}
            onClick={async () => {
              try {
                await update.mutateAsync({ id: request.id, status: 'REJECTED', adminNote: note });
                toast.success('Return rejected.');
                onClose();
              } catch {
                // shown below
              }
            }}
          >
            Reject return
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FormError message={update.error ? errorMessage(update.error) : null} />
        <Textarea label="Reason for the customer" required rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="E.g. item shows signs of use" />
      </div>
    </Modal>
  );
}

/** The next action for a return, following the backend's return state machine. */
function ReturnActions({ request, fullWidth = false }: { request: ReturnRequest; fullWidth?: boolean }) {
  const toast = useToast();
  const { can } = useAuth();
  const update = useUpdateReturnStatus();
  const [dialog, setDialog] = useState<'refund' | 'reject' | null>(null);
  const width = fullWidth ? 'flex-1' : undefined;

  const move = async (status: 'APPROVED' | 'PICKUP' | 'RECEIVED', message: string) => {
    try {
      await update.mutateAsync({ id: request.id, status });
      toast.success(message);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  let primary: React.ReactNode = null;
  const canMove = can(PERMISSIONS.RETURNS_WRITE);
  if (!canMove && request.status !== 'RECEIVED') {
    primary = null;
  } else if (request.status === 'RETURN_REQUESTED') {
    primary = (
      <Button size="sm" className={width} loading={update.isPending} onClick={() => move('APPROVED', 'Return approved.')}>
        Approve
      </Button>
    );
  } else if (request.status === 'APPROVED') {
    primary = (
      <Button size="sm" className={width} loading={update.isPending} onClick={() => move('PICKUP', 'Pickup scheduled.')}>
        Schedule pickup
      </Button>
    );
  } else if (request.status === 'PICKUP') {
    primary = (
      <Button size="sm" className={width} loading={update.isPending} onClick={() => move('RECEIVED', 'Marked as received.')}>
        Mark received
      </Button>
    );
  } else if (request.status === 'RECEIVED') {
    primary = isCod(request) ? (
      <span className="text-[12.5px] font-medium text-amber-800">COD: refund by bank/UPI transfer</span>
    ) : can(PERMISSIONS.ORDERS_REFUND) ? (
      <Button size="sm" className={width} onClick={() => setDialog('refund')}>
        Refund
      </Button>
    ) : null;
  }

  const canReject = canMove && ['RETURN_REQUESTED', 'APPROVED', 'PICKUP'].includes(request.status);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canReject ? (
        <Button size="sm" variant="ghost" className={`${width ?? ''} text-red-700 hover:bg-red-50`} onClick={() => setDialog('reject')}>
          Reject
        </Button>
      ) : null}
      {primary}
      {dialog === 'refund' ? <RefundDialog request={request} onClose={() => setDialog(null)} /> : null}
      {dialog === 'reject' ? <RejectDialog request={request} onClose={() => setDialog(null)} /> : null}
    </div>
  );
}

function ReturnsView() {
  const [query, setQuery] = useUrlParams(['status', 'page', 'search'] as const);
  const filter = (query.status || 'RETURN_REQUESTED') as Filter;
  const page = Math.max(1, Number(query.page) || 1);
  const returns = useReturns({ status: filter === 'ALL' ? '' : filter, page, limit: PAGE_SIZE });

  const rows = useMemo(() => {
    const list = returns.data?.returns ?? [];
    const term = query.search.trim().toLowerCase();
    return term ? list.filter((r) => r.order.orderNumber.toLowerCase().includes(term) || r.customer.name.toLowerCase().includes(term)) : list;
  }, [returns.data, query.search]);

  const tabs: TabItem<Filter>[] = TABS.map((tab) => ({ value: tab.value, label: tab.label }));

  const columns: Column<ReturnRequest>[] = [
    {
      key: 'order',
      header: 'Order',
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          <Link href={`/admin/orders/${r.order.id}`} className="font-mono text-[13px] font-medium text-indigo-700 hover:underline">
            {r.order.orderNumber || '—'}
          </Link>
          <span className="text-[12px] text-slate-500">{formatDateTime(r.createdAt)}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{r.customer.name}</span>
          <span className="text-[12px] text-slate-500">{r.customer.phone || r.customer.email}</span>
        </div>
      ),
    },
    { key: 'reason', header: 'Reason', cell: (r) => <span className="line-clamp-2 max-w-[260px] text-slate-700">{r.reason}</span> },
    { key: 'units', header: 'Units', cell: (r) => <span className="tabular">{r.items.reduce((sum, item) => sum + item.quantity, 0)}</span> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge map={RETURN_STATUS} value={r.status} /> },
    { key: 'actions', header: 'Next step', align: 'right', cell: (r) => <ReturnActions request={r} /> },
  ];

  return (
    <>
      <PageHeader
        title="Returns & refunds"
        description="Approve returns, arrange pickup, check the item when it arrives, then refund."
      />
      {filter === 'RECEIVED' ? (
        <Notice tone="info">
          Online payments are refunded from here. For cash-on-delivery orders, send the money by bank or UPI transfer and keep the reference.
        </Notice>
      ) : null}
      <Card className="overflow-hidden">
        <div className="pt-3 md:pt-0">
          <Tabs label="Return status" items={tabs} value={filter} onChange={(value) => setQuery({ status: value === 'RETURN_REQUESTED' ? null : value, page: null })} />
        </div>
        <FilterBar className="border-b border-slate-100">
          <SearchInput
            className="sm:max-w-sm sm:flex-1"
            label="Find a return"
            placeholder="Order number or customer (this page)"
            value={query.search}
            onChange={(value) => setQuery({ search: value })}
          />
        </FilterBar>
        <DataTable
          caption="Returns"
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          loading={returns.isLoading}
          error={returns.error ? errorMessage(returns.error) : null}
          onRetry={() => returns.refetch()}
          empty={{ title: 'No returns here', description: 'Returns in this status show up here.' }}
          mobileCard={(r) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <Link href={`/admin/orders/${r.order.id}`} className="font-mono text-[14px] font-medium text-indigo-700">
                    {r.order.orderNumber || '—'}
                  </Link>
                  <span className="text-[12.5px] text-slate-500">{formatDateTime(r.createdAt)}</span>
                </div>
                <StatusBadge map={RETURN_STATUS} value={r.status} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">{r.customer.name}</span>
                <span className="text-[13px] text-slate-600">{r.reason}</span>
              </div>
              <ReturnActions request={r} fullWidth />
            </div>
          )}
        />
        {returns.data && returns.data.total > PAGE_SIZE ? (
          <Pagination page={page} pageSize={PAGE_SIZE} total={returns.data.total} onPageChange={(next) => setQuery({ page: next })} />
        ) : null}
      </Card>
    </>
  );
}

export default function ReturnsPage() {
  return (
    <Restricted permission={PERMISSIONS.RETURNS_READ}>
      <Suspense fallback={null}>
        <ReturnsView />
      </Suspense>
    </Restricted>
  );
}
