'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Check, Printer } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/api/types';
import {
  useOrder,
  useRetryCancellationRefund,
  useSendInvoice,
  useUpdateOrderNotes,
  useUpdateOrderStatus,
} from '@/lib/hooks/useOrders';
import { courierLabel, useCouriers, useOrderShipments, useUpdateTracking } from '@/lib/hooks/useFulfilment';
import type { Shipment } from '@/lib/api/types';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { useAuth } from '@/lib/auth/AuthContext';
import { CANCELLABLE_STATUSES, ORDER_STATUS, PAYMENT_STATUS, paymentMethodLabel } from '@/lib/status';
import { cn, errorMessage, formatDateTime, formatINR, humanize } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { DetailList, PageHeader, Section } from '@/components/ui/Layout';
import { Badge, ErrorState, Notice, Skeleton } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button, ButtonLink, EditAction } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Form';
import { ConfirmDialog, Modal, useToast } from '@/components/ui/Overlay';
import { NextStepButton } from '@/components/orders/NextStepButton';

const FLOW: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

/** Where an order sits on the main flow (partial states count as the step they belong to). */
function flowIndex(status: OrderStatus): number {
  if (status === 'PARTIALLY_SHIPPED') return FLOW.indexOf('PACKED');
  if (status === 'PARTIALLY_DELIVERED') return FLOW.indexOf('OUT_FOR_DELIVERY');
  if (status === 'RETURN_REQUESTED' || status === 'RETURNED') return FLOW.length - 1;
  return FLOW.indexOf(status);
}

function Progress({ status }: { status: OrderStatus }) {
  const current = flowIndex(status);
  return (
    <>
      <div className="flex flex-col gap-2 md:hidden">
        <p className="text-sm text-slate-700">
          Step {current + 1} of {FLOW.length} · <span className="font-semibold text-indigo-900">{ORDER_STATUS[FLOW[current] ?? 'PENDING'].label}</span>
          {current < FLOW.length - 1 ? <span className="text-slate-500"> · next: {ORDER_STATUS[FLOW[current + 1]].label.toLowerCase()}</span> : null}
        </p>
        <div className="flex gap-1" aria-hidden="true">
          {FLOW.map((step, index) => (
            <span key={step} className={cn('h-2 flex-1 rounded-full', index <= current ? 'bg-indigo-600' : 'bg-slate-200')} />
          ))}
        </div>
      </div>
      <ProgressSteps current={current} />
    </>
  );
}

function ProgressSteps({ current }: { current: number }) {
  return (
    <ol aria-label="Order progress" className="hidden md:flex">
      {FLOW.map((step, index) => {
        const done = current >= 0 && index < current;
        const isCurrent = index === current;
        return (
          <li key={step} className="flex min-w-[92px] flex-1 flex-col items-center gap-2 text-center" aria-current={isCurrent ? 'step' : undefined}>
            <div className="flex w-full items-center">
              <span className={cn('h-0.5 flex-1', index === 0 ? 'bg-transparent' : done || isCurrent ? 'bg-indigo-500' : 'bg-slate-200')} />
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-semibold',
                  done && 'border-indigo-600 bg-indigo-600 text-white',
                  isCurrent && 'border-indigo-600 bg-white text-indigo-700',
                  !done && !isCurrent && 'border-slate-300 bg-white text-slate-400'
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              <span className={cn('h-0.5 flex-1', index === FLOW.length - 1 ? 'bg-transparent' : done ? 'bg-indigo-500' : 'bg-slate-200')} />
            </div>
            <span className={cn('text-[12px] leading-tight', isCurrent ? 'font-semibold text-indigo-900' : done ? 'text-slate-700' : 'text-slate-400')}>
              {ORDER_STATUS[step].label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Money({ label, value, strong = false, negative = false }: { label: string; value: number; strong?: boolean; negative?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-4 text-sm', strong && 'border-t border-slate-200 pt-2.5 text-base font-semibold')}>
      <span className={strong ? 'text-slate-900' : 'text-slate-600'}>{label}</span>
      <span className="tabular">{negative && value > 0 ? `− ${formatINR(value)}` : formatINR(value)}</span>
    </div>
  );
}

function NotesCard({ order, canWrite }: { order: Order; canWrite: boolean }) {
  const toast = useToast();
  const save = useUpdateOrderNotes();
  const [notes, setNotes] = useState(order.notes ?? '');
  useEffect(() => setNotes(order.notes ?? ''), [order.notes]);
  const changed = notes.trim() !== (order.notes ?? '').trim();
  return (
    <Section title="Internal notes" description="Only staff see these.">
      <div className="flex flex-col gap-3">
        <Textarea
          label="Notes"
          rows={3}
          maxLength={2000}
          value={notes}
          disabled={!canWrite}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="E.g. customer asked for evening delivery"
        />
        <div className={canWrite ? 'flex justify-end' : 'hidden'}>
          <Button
            variant="secondary"
            size="sm"
            disabled={!changed}
            loading={save.isPending}
            onClick={async () => {
              try {
                await save.mutateAsync({ id: order.id, notes: notes.trim() });
                toast.success('Notes saved.');
              } catch (error) {
                toast.error(errorMessage(error));
              }
            }}
          >
            Save notes
          </Button>
        </div>
      </div>
    </Section>
  );
}

/** Add or correct the courier AWB on a shipment after it was shipped. */
function TrackingDialog({ orderId, shipment, onClose }: { orderId: string; shipment: Shipment; onClose: () => void }) {
  const toast = useToast();
  const update = useUpdateTracking();
  const couriers = useCouriers();
  const [value, setValue] = useState(shipment.trackingNumber ?? '');
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    if (!value.trim()) return setError('Enter the tracking number from the courier receipt.');
    try {
      await update.mutateAsync({ orderId, shipmentId: shipment.id, trackingNumber: value });
      toast.success('Tracking number saved.');
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      busy={update.isPending}
      size="sm"
      title={shipment.trackingNumber ? 'Edit tracking number' : 'Add tracking number'}
      description={`${shipment.shipmentNumber} · ${courierLabel(couriers.data, shipment.provider, shipment.courierName)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={save} loading={update.isPending}>
            Save tracking number
          </Button>
        </>
      }
    >
      <Input label="Tracking number (AWB)" required value={value} error={error ?? undefined} onChange={(e) => setValue(e.target.value)} className="font-mono" hint="Customers see it on their order page." />
    </Modal>
  );
}

function OrderDetail({ id }: { id: string }) {
  const toast = useToast();
  const { data: order, isLoading, error, refetch } = useOrder(id);
  const { can } = useAuth();
  const shipments = useOrderShipments(id, Boolean(order) && order!.status !== 'PENDING' && can(PERMISSIONS.SHIPPING_READ));
  const updateStatus = useUpdateOrderStatus();
  const saveNotes = useUpdateOrderNotes();
  const sendInvoice = useSendInvoice();
  const retryRefund = useRetryCancellationRefund();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [trackingFor, setTrackingFor] = useState<Shipment | null>(null);
  const couriers = useCouriers();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (error || !order) {
    return <ErrorState title="Could not load this order" message={errorMessage(error, 'Order not found.')} onRetry={() => refetch()} />;
  }

  const canCancel = can(PERMISSIONS.ORDERS_WRITE) && (CANCELLABLE_STATUSES.includes(order.status));
  const address = order.shippingAddress;
  const invoiceReady = Boolean(order.invoiceNumber);

  const cancelOrder = async () => {
    try {
      await updateStatus.mutateAsync({ id: order.id, status: 'CANCELLED' });
      if (cancelReason.trim()) {
        const note = `Cancelled by staff: ${cancelReason.trim()}`;
        await saveNotes.mutateAsync({ id: order.id, notes: order.notes ? `${order.notes}\n${note}` : note });
      }
      setCancelOpen(false);
      toast.success(`${order.orderNumber} cancelled.`);
    } catch (err) {
      toast.error(errorMessage(err, 'The order could not be cancelled.'));
    }
  };

  return (
    <>
      <PageHeader
        title={<span className="font-mono">{order.orderNumber}</span>}
        badge={
          <>
            <StatusBadge map={ORDER_STATUS} value={order.status} />
            <StatusBadge map={PAYMENT_STATUS} value={order.paymentStatus} />
          </>
        }
        description={`Placed ${formatDateTime(order.placedAt)} · ${paymentMethodLabel(order.paymentMethod)}`}
        actions={
          <>
            {canCancel ? (
              <Button variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => setCancelOpen(true)}>
                Cancel order
              </Button>
            ) : null}
            <ButtonLink
              href={`/print/orders?type=pack&ids=${order.id}`}
              target="_blank"
              variant="secondary"
              icon={<Printer className="h-4 w-4" aria-hidden="true" />}
            >
              Packing slip
            </ButtonLink>
            <NextStepButton order={order} size="md" showView={false} />
          </>
        }
      />

      {order.status === 'CANCELLED' ? (
        <Notice tone="warning" title="This order was cancelled">
          {order.cancelledAt ? `Cancelled ${formatDateTime(order.cancelledAt)}.` : null} Stock for its items has been released.
        </Notice>
      ) : order.status === 'RETURN_REQUESTED' ? (
        <Notice tone="info" title="The customer asked to return this order" action={<ButtonLink href={`/admin/returns?search=${order.orderNumber}`} size="sm">Review return</ButtonLink>}>
          Approve or reject it on the Returns page.
        </Notice>
      ) : (
        <Section title="Progress">
          <Progress status={order.status} />
        </Section>
      )}

      {order.cancellationRefundStatus === 'FAILED' ? (
        <Notice
          tone="danger"
          title="A refund for cancelled items failed"
          action={
            can(PERMISSIONS.ORDERS_REFUND) ? (
            <Button
              size="sm"
              loading={retryRefund.isPending}
              onClick={async () => {
                try {
                  await retryRefund.mutateAsync(order.id);
                  toast.success('Refund sent again.');
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
            >
              Retry refund
            </Button>
            ) : undefined
          }
        >
          {formatINR(order.cancelledAmount - order.cancellationRefundedAmount)} has not reached the customer yet.
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Section title={`Items (${order.items.length})`}>
            <ul className="flex flex-col divide-y divide-slate-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- product images come from Cloudinary URLs of any size
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-medium text-slate-900">{item.name}</span>
                    <span className="text-[12.5px] text-slate-500">
                      {[item.variant, item.sku && `SKU ${item.sku}`].filter(Boolean).join(' · ')}
                    </span>
                    {item.cancelledQuantity > 0 ? (
                      <span className="text-[12.5px] font-medium text-amber-800">{item.cancelledQuantity} cancelled</span>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-sm">
                    <span className="tabular font-semibold">{formatINR(item.total)}</span>
                    <span className="tabular text-[12.5px] text-slate-500">
                      {item.quantity} × {formatINR(item.price)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Payment">
            <div className="flex flex-col gap-2">
              <Money label="Items" value={order.subtotal} />
              {order.discount > 0 ? <Money label={order.couponCode ? `Discount (${order.couponCode})` : 'Discount'} value={order.discount} negative /> : null}
              <Money label="Shipping" value={order.shippingFee} />
              <Money label="Tax" value={order.tax} />
              <Money label="Order total" value={order.totalAmount} strong />
              {order.cancelledAmount > 0 ? (
                <>
                  <Money label="Cancelled items" value={order.cancelledAmount} negative />
                  <p className="text-[12.5px] text-slate-500">Refund status: {humanize(order.cancellationRefundStatus)}</p>
                </>
              ) : null}
            </div>
          </Section>

          <Section title="Shipments" description="Created when the order is shipped.">
            {shipments.isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : shipments.data && shipments.data.length > 0 ? (
              <ul className="flex flex-col divide-y divide-slate-100">
                {shipments.data.map((shipment) => (
                  <li key={shipment.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[13px] font-medium">{shipment.shipmentNumber}</span>
                      <span className="text-[12.5px] text-slate-500">
                        {courierLabel(couriers.data, shipment.provider, shipment.courierName)}
                        {shipment.trackingNumber ? ` · AWB ${shipment.trackingNumber}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={shipment.status === 'DELIVERED' ? 'green' : shipment.status === 'FAILED' ? 'red' : 'blue'}>{humanize(shipment.status)}</Badge>
                      {can(PERMISSIONS.SHIPPING_WRITE) && shipment.status !== 'DELIVERED' ? (
                        <EditAction label={shipment.trackingNumber ? 'Edit tracking' : 'Add tracking'} onClick={() => setTrackingFor(shipment)} />
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">No shipment yet.</p>
            )}
            {trackingFor ? <TrackingDialog orderId={order.id} shipment={trackingFor} onClose={() => setTrackingFor(null)} /> : null}
          </Section>

          <NotesCard order={order} canWrite={can(PERMISSIONS.ORDERS_WRITE)} />
        </div>

        <div className="flex flex-col gap-5">
          <Section title="Customer">
            <DetailList
              className="sm:grid-cols-1"
              items={[
                {
                  label: 'Name',
                  value: order.customer.id ? (
                    <Link href={`/admin/customers/${order.customer.id}`} className="font-medium text-indigo-700 hover:underline">
                      {order.customer.name}
                    </Link>
                  ) : (
                    order.customer.name
                  ),
                },
                { label: 'Email', value: order.customer.email || '—' },
                { label: 'Phone', value: order.customer.phone || '—' },
              ]}
            />
          </Section>

          <Section title="Ship to">
            <address className="flex flex-col gap-0.5 text-sm not-italic text-slate-800">
              <span className="font-semibold">{address.name}</span>
              <span>{address.addressLine1}</span>
              {address.addressLine2 ? <span>{address.addressLine2}</span> : null}
              {address.landmark ? <span>Near {address.landmark}</span> : null}
              <span>
                {address.city}, {address.state} {address.postalCode}
              </span>
              {address.phone ? <span className="mt-1 text-slate-600">Phone {address.phone}</span> : null}
            </address>
          </Section>

          <Section title="Key dates">
            <DetailList
              className="sm:grid-cols-1"
              items={[
                { label: 'Placed', value: formatDateTime(order.placedAt) },
                { label: 'Paid', value: formatDateTime(order.paidAt) },
                { label: 'Shipped', value: formatDateTime(order.shippedAt) },
                { label: 'Delivered', value: formatDateTime(order.deliveredAt) },
                { label: 'Return window ends', value: formatDateTime(order.returnWindowEndsAt) },
              ]}
            />
          </Section>

          <Section title="Tax invoice">
            {invoiceReady ? (
              <div className="flex flex-col gap-3">
                <DetailList
                  className="sm:grid-cols-1"
                  items={[
                    { label: 'Invoice number', value: <span className="font-mono">{order.invoiceNumber}</span> },
                    { label: 'Emailed to customer', value: order.invoiceSentAt ? formatDateTime(order.invoiceSentAt) : 'Not yet' },
                  ]}
                />
                <div className="flex flex-wrap gap-2">
                  {order.invoiceUrl ? (
                    <ButtonLink href={order.invoiceUrl} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
                      Open invoice
                    </ButtonLink>
                  ) : null}
                  {can(PERMISSIONS.ORDERS_WRITE) ? (
                  <Button
                    size="sm"
                    variant="soft"
                    loading={sendInvoice.isPending}
                    onClick={async () => {
                      try {
                        await sendInvoice.mutateAsync(order.id);
                        toast.success('Invoice emailed to the customer.');
                      } catch (err) {
                        toast.error(errorMessage(err));
                      }
                    }}
                  >
                    {order.invoiceSentAt ? 'Email again' : 'Email invoice'}
                  </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">The invoice is created when the order ships.</p>
            )}
          </Section>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelOrder}
        busy={updateStatus.isPending || saveNotes.isPending}
        tone="danger"
        title={`Cancel ${order.orderNumber}?`}
        confirmLabel="Cancel order"
        message={
          order.paymentStatus === 'PAID'
            ? 'The customer has paid online. The payment is refunded to them and the stock is released.'
            : 'The stock for these items is released. This cannot be undone.'
        }
      >
        <Textarea label="Reason (saved in notes)" rows={2} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
      </ConfirmDialog>
    </>
  );
}

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  return (
    <Restricted permission={PERMISSIONS.ORDERS_READ}>
      <OrderDetail id={params.id} />
    </Restricted>
  );
}
