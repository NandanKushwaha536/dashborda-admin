'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Order } from '@/lib/api/types';
import { useCouriers, useShipOrder } from '@/lib/hooks/useFulfilment';
import { useWarehouses } from '@/lib/hooks/useWarehouses';
import { Modal } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { FormError, Input, Select } from '@/components/ui/Form';
import { Notice, Spinner } from '@/components/ui/Feedback';
import { errorMessage, formatINR } from '@/lib/format';

const LAST_COURIER_KEY = 'admin:last-courier';

function lastCourier(): string {
  try {
    return localStorage.getItem(LAST_COURIER_KEY) ?? '';
  } catch {
    return '';
  }
}

/**
 * Hand a packed order to the courier. The store books the parcel on its own
 * courier account (counter or the courier's portal) as usual, then records the
 * courier and the AWB here. Creates the shipment and marks it shipped; the
 * customer sees the courier and AWB on their order page.
 */
export function ShipDialog({ order, open, onClose, onShipped }: {
  order: Order;
  open: boolean;
  onClose: () => void;
  onShipped: () => void;
}) {
  const { data, isLoading } = useWarehouses();
  const pickupLocations = useMemo(() => (data?.warehouses ?? []).filter((w) => w.status === 'ACTIVE'), [data]);
  const ship = useShipOrder();
  const couriers = useCouriers();
  const [warehouseId, setWarehouseId] = useState('');
  const [provider, setProvider] = useState('');
  const [courierName, setCourierName] = useState('');
  const [awb, setAwb] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !warehouseId && pickupLocations.length > 0) setWarehouseId(pickupLocations[0].id);
  }, [open, warehouseId, pickupLocations]);

  // Start with the courier used last time (most stores use one courier most of the time).
  useEffect(() => {
    if (!open || provider || !couriers.data?.length) return;
    const remembered = lastCourier();
    setProvider(couriers.data.some((courier) => courier.code === remembered) ? remembered : couriers.data[0].code);
  }, [open, provider, couriers.data]);

  const ownDelivery = provider === 'STANDARD';
  const otherCourier = provider === 'COURIER';
  const needsAwb = Boolean(provider) && !ownDelivery;

  const submit = async () => {
    setFieldError(null);
    if (!warehouseId) {
      setFieldError('Choose where the parcel is shipped from.');
      return;
    }
    if (!provider) {
      setFieldError('Choose the courier.');
      return;
    }
    if (otherCourier && courierName.trim().length < 2) {
      setFieldError('Enter the courier company name.');
      return;
    }
    if (needsAwb && awb.trim().length < 4) {
      setFieldError('Enter the AWB / tracking number from the courier receipt.');
      return;
    }
    try {
      await ship.mutateAsync({ orderId: order.id, warehouseId, provider, courierName, trackingNumber: awb });
      try {
        localStorage.setItem(LAST_COURIER_KEY, provider);
      } catch {
        // Only a convenience.
      }
      onShipped();
    } catch {
      // Shown below from ship.error.
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={ship.isPending}
      title={`Ship order ${order.orderNumber}`}
      description="Book the parcel on your courier account as usual, then enter the courier and AWB here. The customer gets a shipped update with the AWB, and the invoice is created."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={ship.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={ship.isPending} disabled={pickupLocations.length === 0}>
            Mark as shipped
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormError message={fieldError ?? (ship.error ? errorMessage(ship.error) : null)} />
        {isLoading ? (
          <Spinner />
        ) : pickupLocations.length === 0 ? (
          <Notice
            tone="warning"
            title="Add a pickup location first"
            action={
              <Link href="/admin/settings?tab=pickup" className="font-semibold underline">
                Open settings
              </Link>
            }
          >
            Shipments need the address the parcel leaves from.
          </Notice>
        ) : (
          <Select
            label="Ship from"
            required
            value={warehouseId}
            onChange={(event) => setWarehouseId(event.target.value)}
            options={pickupLocations.map((w) => ({ value: w.id, label: `${w.name} · ${w.city}` }))}
          />
        )}
        <Select
          label="Courier"
          required
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          placeholder={couriers.isLoading ? 'Loading couriers…' : 'Choose courier'}
          options={(couriers.data ?? []).map((courier) => ({ value: courier.code, label: courier.label }))}
          hint={couriers.error ? errorMessage(couriers.error) : undefined}
        />
        {otherCourier ? (
          <Input label="Courier company name" required value={courierName} maxLength={60} onChange={(event) => setCourierName(event.target.value)} placeholder="E.g. Local Speed Couriers" />
        ) : null}
        <Input
          label={ownDelivery ? 'Reference number (optional)' : 'AWB / tracking number'}
          required={needsAwb}
          value={awb}
          onChange={(event) => setAwb(event.target.value)}
          autoCapitalize="characters"
          className="font-mono"
          hint={ownDelivery ? 'Not needed when your own team delivers.' : 'From the courier receipt or label. The customer uses it to track the parcel.'}
        />
        {order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID' ? (
          <Notice tone="info">
            Cash on delivery: {ownDelivery ? 'your delivery person collects' : 'book it as a COD parcel; the courier collects'} {formatINR(order.totalAmount - order.cancelledAmount)}.
          </Notice>
        ) : null}
      </div>
    </Modal>
  );
}
