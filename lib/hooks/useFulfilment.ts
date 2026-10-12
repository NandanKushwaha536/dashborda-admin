'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList } from '@/lib/api/normalize';
import type { Shipment } from '@/lib/api/types';
import { useInvalidateOrders } from './useOrders';

type Raw = Record<string, unknown>;

export interface Courier {
  code: string;
  label: string;
  hasTracking: boolean;
}

/**
 * Couriers the store books with on its own accounts (backend constants/couriers.ts).
 * The admin only records the courier and AWB; no courier API is called.
 */
export function useCouriers() {
  return useQuery({
    queryKey: queryKeys.couriers,
    queryFn: async (): Promise<Courier[]> => {
      const res = await api.get<{ data?: Courier[] }>(ENDPOINTS.shipments.couriers);
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60 * 60_000,
  });
}

/** Display name for a shipment's courier. */
export function courierLabel(couriers: Courier[] | undefined, provider: string, courierName?: string): string {
  if (provider === 'COURIER' && courierName) return courierName;
  return couriers?.find((courier) => courier.code === provider)?.label ?? provider.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

const DONE_SHIPMENT_STATUSES = new Set(['DELIVERED', 'RETURNED', 'RTO_RECEIVED', 'RETURN_TO_ORIGIN', 'FAILED']);

function normalizeShipment(row: Raw): Shipment {
  return {
    id: String(row._id ?? row.id ?? ''),
    shipmentNumber: String(row.shipmentNumber ?? ''),
    status: String(row.status ?? 'PENDING'),
    provider: String(row.provider ?? 'STANDARD'),
    courierName: typeof row.courierName === 'string' && row.courierName ? row.courierName : undefined,
    trackingNumber: typeof row.trackingNumber === 'string' && row.trackingNumber ? row.trackingNumber : undefined,
    createdAt: String(row.createdAt ?? ''),
  };
}

async function fetchOrderShipments(orderId: string): Promise<Shipment[]> {
  const res = await api.get<unknown>(ENDPOINTS.shipments.list, { params: { orderId, limit: 50 } });
  // Also filter here: a backend without the orderId filter would return every shipment.
  return normalizeList<Raw>(res)
    .filter((row) => {
      const order = row.order && typeof row.order === 'object' ? (row.order as Raw)._id : row.order;
      return String(order ?? '') === orderId;
    })
    .map(normalizeShipment);
}

export function useOrderShipments(orderId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.orders.shipments(orderId),
    queryFn: () => fetchOrderShipments(orderId),
    enabled: Boolean(orderId) && enabled,
    staleTime: 10_000,
  });
}

function setShipmentStatus(id: string, status: string, trackingNumber?: string) {
  return api.patch<unknown>(ENDPOINTS.shipments.status(id), {
    status,
    ...(trackingNumber ? { trackingNumber } : {}),
  });
}

/**
 * Ship a packed order: create the shipment for every remaining item, then
 * hand it to the courier. The backend moves the order to SHIPPED and creates
 * the tax invoice when the shipment is marked shipped.
 */
export function useShipOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: async (input: { orderId: string; warehouseId: string; provider: string; courierName?: string; trackingNumber?: string }) => {
      const created = await api.post<{ data?: Raw }>(ENDPOINTS.shipments.fromOrder, {
        orderId: input.orderId,
        warehouseId: input.warehouseId,
        provider: input.provider,
        ...(input.provider === 'COURIER' && input.courierName?.trim() ? { courierName: input.courierName.trim() } : {}),
      });
      const shipment = normalizeShipment(created.data ?? {});
      if (!shipment.id) throw new Error('The shipment was not created. Please refresh and try again.');
      await setShipmentStatus(shipment.id, 'PROCESSING');
      await setShipmentStatus(shipment.id, 'SHIPPED', input.trackingNumber?.trim() || undefined);
      return shipment;
    },
    onSuccess: (_data, variables) => invalidate(variables.orderId),
  });
}

/** Adds or corrects the courier tracking number (AWB) on a shipment. */
export function useUpdateTracking() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ shipmentId, trackingNumber }: { orderId: string; shipmentId: string; trackingNumber: string }) =>
      api.patch<unknown>(ENDPOINTS.shipments.tracking(shipmentId), { trackingNumber: trackingNumber.trim() }),
    onSuccess: (_data, variables) => invalidate(variables.orderId),
  });
}

/**
 * Out for delivery / delivered. Moves every open shipment of the order; the
 * backend then updates the order (and settles COD and the return window on
 * delivery). Orders shipped before shipments existed fall back to a plain
 * order status change.
 */
export function useAdvanceDelivery() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: async ({ orderId, to, cashCollected = false }: { orderId: string; to: 'OUT_FOR_DELIVERY' | 'DELIVERED'; cashCollected?: boolean }) => {
      const shipments = (await fetchOrderShipments(orderId)).filter((shipment) => !DONE_SHIPMENT_STATUSES.has(shipment.status));
      if (shipments.length === 0) {
        await api.patch<unknown>(ENDPOINTS.orders.updateStatus(orderId), { status: to });
      } else {
        for (const shipment of shipments) {
          if (shipment.status !== to) await setShipmentStatus(shipment.id, to);
        }
      }
      // The backend does not mark cash-on-delivery orders paid by itself.
      if (to === 'DELIVERED' && cashCollected) {
        await api.patch<unknown>(ENDPOINTS.orders.paymentStatus(orderId), { status: 'PAID' });
      }
      // A shipment going out for delivery does not change the order by itself.
      if (to === 'OUT_FOR_DELIVERY' && shipments.length > 0) {
        await api.patch<unknown>(ENDPOINTS.orders.updateStatus(orderId), { status: 'OUT_FOR_DELIVERY' });
      }
    },
    onSuccess: (_data, variables) => invalidate(variables.orderId),
  });
}
