'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Order } from '@/lib/api/types';
import { ORDER_STATUS, nextStepFor } from '@/lib/status';
import { useUpdateOrderStatus } from '@/lib/hooks/useOrders';
import { useAdvanceDelivery } from '@/lib/hooks/useFulfilment';
import { Button, type ButtonSize } from '@/components/ui/Button';
import { ConfirmDialog, useToast } from '@/components/ui/Overlay';
import { errorMessage, formatINR } from '@/lib/format';
import { ShipDialog } from './ShipDialog';
import { useAuth } from '@/lib/auth/AuthContext';
import { PERMISSIONS } from '@/lib/auth/permissions';

/**
 * The single "what happens next" button for an order, used in the list and on
 * the order page. Terminal orders get a View link instead.
 */
export function NextStepButton({
  order,
  size = 'sm',
  fullWidth = false,
  showView = true,
}: {
  order: Order;
  size?: ButtonSize;
  fullWidth?: boolean;
  showView?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const updateStatus = useUpdateOrderStatus();
  const advanceDelivery = useAdvanceDelivery();
  const [shipOpen, setShipOpen] = useState(false);
  const [confirmDelivered, setConfirmDelivered] = useState(false);
  const { can } = useAuth();
  const next = nextStepFor(order);
  // Show the step only to roles that may do it; others get View.
  const allowed =
    !next ||
    next.kind === 'payment' ||
    (next.kind === 'status' && can(PERMISSIONS.ORDERS_WRITE)) ||
    (next.kind === 'ship' && can(PERMISSIONS.SHIPPING_WRITE)) ||
    (next.kind === 'delivery' && can(PERMISSIONS.SHIPPING_WRITE) && can(PERMISSIONS.ORDERS_WRITE)) ||
    (next.kind === 'returns' && can(PERMISSIONS.RETURNS_READ));
  const step = allowed ? next : null;
  const busy = updateStatus.isPending || advanceDelivery.isPending;
  const width = fullWidth ? 'w-full' : undefined;

  if (!step) {
    return showView ? (
      <Button variant="secondary" size={size} className={width} onClick={() => router.push(`/admin/orders/${order.id}`)}>
        View
      </Button>
    ) : null;
  }

  if (step.kind === 'payment') {
    return (
      <Button variant="secondary" size={size} className={width} disabled title="The customer has not paid online yet. Unpaid orders cancel automatically.">
        {step.label}
      </Button>
    );
  }

  const codDue = order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID';

  const run = async (cashCollected = false) => {
    try {
      if (step.kind === 'status') {
        await updateStatus.mutateAsync({ id: order.id, status: step.to });
        toast.success(`${order.orderNumber} moved to ${ORDER_STATUS[step.to].label.toLowerCase()}.`);
      } else if (step.kind === 'delivery') {
        await advanceDelivery.mutateAsync({ orderId: order.id, to: step.to, cashCollected });
        toast.success(step.to === 'DELIVERED' ? `${order.orderNumber} delivered.` : `${order.orderNumber} is out for delivery.`);
      }
    } catch (error) {
      toast.error(errorMessage(error, 'The order could not be updated.'));
    }
  };

  const onClick = () => {
    if (step.kind === 'ship') setShipOpen(true);
    else if (step.kind === 'returns') router.push(`/admin/returns?search=${encodeURIComponent(order.orderNumber)}`);
    else if (step.kind === 'delivery' && step.to === 'DELIVERED' && codDue) setConfirmDelivered(true);
    else void run();
  };

  return (
    <>
      <Button size={size} className={width} onClick={onClick} loading={busy}>
        {step.label}
      </Button>
      {step.kind === 'ship' ? (
        <ShipDialog
          order={order}
          open={shipOpen}
          onClose={() => setShipOpen(false)}
          onShipped={() => {
            setShipOpen(false);
            toast.success(`${order.orderNumber} shipped.`);
          }}
        />
      ) : null}
      <ConfirmDialog
        open={confirmDelivered}
        onClose={() => setConfirmDelivered(false)}
        busy={advanceDelivery.isPending}
        title="Cash collected?"
        confirmLabel="Yes, mark delivered"
        message={
          <>
            This is a cash-on-delivery order. Mark it delivered only after {formatINR(order.totalAmount - order.cancelledAmount)} is collected.
            The order will be marked paid.
          </>
        }
        onConfirm={async () => {
          await run(true);
          setConfirmDelivered(false);
        }}
      />
    </>
  );
}
