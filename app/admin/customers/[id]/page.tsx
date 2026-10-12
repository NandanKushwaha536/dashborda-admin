'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCustomer, useUpdateCustomer, type CustomerDetail } from '@/lib/hooks/useCustomers';
import { useAuth } from '@/lib/auth/AuthContext';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { CUSTOMER_STATUS, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/status';
import { errorMessage, formatDate, formatDateTime, formatINR, formatNumber } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { DetailList, PageHeader, Section, StatTile } from '@/components/ui/Layout';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Form';
import { ConfirmDialog, useToast } from '@/components/ui/Overlay';

function NotesSection({ customer, canWrite }: { customer: CustomerDetail; canWrite: boolean }) {
  const toast = useToast();
  const update = useUpdateCustomer();
  const [notes, setNotes] = useState(customer.adminNotes);
  const [tags, setTags] = useState(customer.tags.join(', '));
  useEffect(() => {
    setNotes(customer.adminNotes);
    setTags(customer.tags.join(', '));
  }, [customer.adminNotes, customer.tags]);
  const changed = notes.trim() !== customer.adminNotes.trim() || tags.trim() !== customer.tags.join(', ');

  return (
    <Section title="Staff notes" description="Only staff see these.">
      <div className="flex flex-col gap-3">
        <Textarea label="Notes" rows={4} maxLength={5000} value={notes} disabled={!canWrite} onChange={(event) => setNotes(event.target.value)} placeholder="E.g. prefers delivery after 6 pm" />
        <Input label="Tags" value={tags} disabled={!canWrite} onChange={(event) => setTags(event.target.value)} hint="Comma separated, e.g. wholesale, repeat buyer" />
        {canWrite ? (
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              disabled={!changed}
              loading={update.isPending}
              onClick={async () => {
                try {
                  await update.mutateAsync({
                    id: customer.id,
                    adminNotes: notes.trim(),
                    tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 50),
                  });
                  toast.success('Saved.');
                } catch (error) {
                  toast.error(errorMessage(error));
                }
              }}
            >
              Save
            </Button>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

function CustomerView({ id }: { id: string }) {
  const toast = useToast();
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.USERS_WRITE);
  const { data: customer, isLoading, error, refetch } = useCustomer(id);
  const update = useUpdateCustomer();
  const [confirmBlock, setConfirmBlock] = useState(false);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error || !customer) return <ErrorState title="Could not load this customer" message={errorMessage(error, 'Customer not found.')} onRetry={() => refetch()} />;

  const blocked = customer.status === 'BLOCKED';
  const average = customer.ordersCount > 0 ? customer.totalSpent / customer.ordersCount : 0;

  return (
    <>
      <PageHeader
        title={customer.name}
        badge={<StatusBadge map={CUSTOMER_STATUS} value={customer.status} />}
        description={`Customer since ${formatDate(customer.createdAt)}`}
        actions={
          canWrite && customer.status !== 'DELETED' ? (
            <Button variant={blocked ? 'secondary' : 'ghost'} className={blocked ? undefined : 'text-red-700 hover:bg-red-50'} onClick={() => setConfirmBlock(true)}>
              {blocked ? 'Unblock customer' : 'Block customer'}
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Paid orders" value={formatNumber(customer.ordersCount)} />
        <StatTile label="Total spent" value={formatINR(customer.totalSpent)} />
        <StatTile label="Average order" value={formatINR(average)} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Section title="Recent orders" description="The latest 20 orders.">
          {customer.orders.length === 0 ? (
            <EmptyState title="No orders yet" className="py-6" />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {customer.orders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-0.5">
                    <Link href={`/admin/orders/${order.id}`} className="font-mono text-[13px] font-medium text-indigo-700 hover:underline">
                      {order.orderNumber}
                    </Link>
                    <span className="text-[12px] text-slate-500">
                      {formatDateTime(order.createdAt)} · {order.items} items
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge map={ORDER_STATUS} value={order.status} />
                    <StatusBadge map={PAYMENT_STATUS} value={order.paymentStatus} />
                    <span className="tabular w-24 text-right font-semibold">{formatINR(order.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <div className="flex flex-col gap-5">
          <Section title="Contact">
            <DetailList
              className="sm:grid-cols-1"
              items={[
                { label: 'Email', value: customer.email || '—' },
                { label: 'Phone', value: customer.phone || '—' },
                { label: 'Last sign-in', value: formatDateTime(customer.lastLogin) },
              ]}
            />
            <p className="mt-3 text-[12px] text-slate-500">Email and phone are partly hidden to protect the customer&apos;s privacy.</p>
          </Section>
          <NotesSection customer={customer} canWrite={canWrite} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        tone={blocked ? 'primary' : 'danger'}
        busy={update.isPending}
        title={blocked ? `Unblock ${customer.name}?` : `Block ${customer.name}?`}
        confirmLabel={blocked ? 'Unblock' : 'Block'}
        message={blocked ? 'They can sign in and order again.' : 'They can no longer sign in or place orders. Existing orders are not affected.'}
        onConfirm={async () => {
          try {
            await update.mutateAsync({ id: customer.id, status: blocked ? 'ACTIVE' : 'BLOCKED' });
            toast.success(blocked ? 'Customer unblocked.' : 'Customer blocked.');
            setConfirmBlock(false);
          } catch (err) {
            toast.error(errorMessage(err));
          }
        }}
      />
    </>
  );
}

export default function CustomerPage() {
  const params = useParams<{ id: string }>();
  return (
    <Restricted permission={PERMISSIONS.USERS_READ}>
      <CustomerView id={params.id} />
    </Restricted>
  );
}
