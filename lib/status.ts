/**
 * Labels, colours and next steps for every status the backend uses.
 * Order flow mirrors backend src/domain/orders/order-state-machine.ts:
 *   PENDING → CONFIRMED → PROCESSING (picking) → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
 *   DELIVERED → RETURN_REQUESTED → RETURNED, and CANCELLED before dispatch.
 */
import type { BadgeTone } from '@/components/ui/Feedback';
import type { OrderStatus, PaymentStatus } from '@/lib/api/types';

interface StatusStyle {
  label: string;
  tone: BadgeTone;
}

export const ORDER_STATUS: Record<OrderStatus, StatusStyle> = {
  PENDING: { label: 'New', tone: 'amber' },
  CONFIRMED: { label: 'Confirmed', tone: 'indigo' },
  PROCESSING: { label: 'Picking', tone: 'sky' },
  PACKED: { label: 'Packed', tone: 'violet' },
  PARTIALLY_SHIPPED: { label: 'Partly shipped', tone: 'blue' },
  SHIPPED: { label: 'Shipped', tone: 'blue' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', tone: 'cyan' },
  PARTIALLY_DELIVERED: { label: 'Partly delivered', tone: 'cyan' },
  DELIVERED: { label: 'Delivered', tone: 'green' },
  RETURN_REQUESTED: { label: 'Return requested', tone: 'orange' },
  RETURNED: { label: 'Returned', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

/** Order of stage tabs on the Orders page. */
export const ORDER_STAGE_TABS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURN_REQUESTED',
  'CANCELLED',
];

/**
 * The one next step for an order.
 * - status: a plain order status change.
 * - ship: create the shipment (pickup location, courier, AWB) — the order becomes SHIPPED from it.
 * - delivery: move the shipment(s) on; the backend then settles the order (COD, invoice, delivery time).
 * - returns: handled on the Returns page.
 * - payment: an online order that is not paid yet; the backend refuses to confirm it
 *   and cancels it by itself when the payment window runs out.
 */
export type NextStep =
  | { kind: 'status'; to: OrderStatus; label: string }
  | { kind: 'ship'; label: string }
  | { kind: 'delivery'; to: 'OUT_FOR_DELIVERY' | 'DELIVERED'; label: string }
  | { kind: 'returns'; label: string }
  | { kind: 'payment'; label: string };

export function nextStepFor(order: { status: OrderStatus; paymentMethod?: string; paymentStatus?: string }): NextStep | null {
  if (order.status === 'PENDING' && order.paymentMethod === 'ONLINE' && order.paymentStatus !== 'PAID') {
    return { kind: 'payment', label: 'Awaiting payment' };
  }
  switch (order.status) {
    case 'PENDING':
      return { kind: 'status', to: 'CONFIRMED', label: 'Confirm order' };
    case 'CONFIRMED':
      return { kind: 'status', to: 'PROCESSING', label: 'Start picking' };
    case 'PROCESSING':
      return { kind: 'status', to: 'PACKED', label: 'Mark packed' };
    case 'PACKED':
    case 'PARTIALLY_SHIPPED':
      return { kind: 'ship', label: 'Ship order' };
    case 'SHIPPED':
      return { kind: 'delivery', to: 'OUT_FOR_DELIVERY', label: 'Out for delivery' };
    case 'OUT_FOR_DELIVERY':
    case 'PARTIALLY_DELIVERED':
      return { kind: 'delivery', to: 'DELIVERED', label: 'Mark delivered' };
    case 'RETURN_REQUESTED':
      return { kind: 'returns', label: 'Review return' };
    default:
      return null;
  }
}

/** Backend allows cancelling only before the parcel leaves (domain/orders/order-cancellation.ts). */
export const CANCELLABLE_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'];

export const PAYMENT_STATUS: Record<PaymentStatus, StatusStyle> = {
  PAID: { label: 'Paid', tone: 'green' },
  PENDING: { label: 'Pending', tone: 'amber' },
  FAILED: { label: 'Failed', tone: 'red' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
};

export function paymentMethodLabel(method: string): string {
  return method === 'COD' ? 'Cash on delivery' : 'Online';
}

export const PRODUCT_STATUS: Record<string, StatusStyle> = {
  ACTIVE: { label: 'Active', tone: 'green' },
  DRAFT: { label: 'Draft', tone: 'neutral' },
  PENDING_REVIEW: { label: 'In review', tone: 'amber' },
  INACTIVE: { label: 'Inactive', tone: 'amber' },
  OUT_OF_STOCK: { label: 'Out of stock', tone: 'red' },
};

export const STOCK_STATUS: Record<string, StatusStyle> = {
  IN_STOCK: { label: 'In stock', tone: 'green' },
  LOW_STOCK: { label: 'Low stock', tone: 'amber' },
  OUT_OF_STOCK: { label: 'Out of stock', tone: 'red' },
};

export const RETURN_STATUS: Record<string, StatusStyle> = {
  RETURN_REQUESTED: { label: 'Requested', tone: 'orange' },
  APPROVED: { label: 'Approved', tone: 'indigo' },
  PICKUP: { label: 'Pickup scheduled', tone: 'sky' },
  RECEIVED: { label: 'Received', tone: 'violet' },
  REFUND_PROCESSING: { label: 'Refund processing', tone: 'blue' },
  REFUNDED: { label: 'Refunded', tone: 'green' },
  REJECTED: { label: 'Rejected', tone: 'red' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

export const COUPON_STATUS: Record<string, StatusStyle> = {
  ACTIVE: { label: 'Active', tone: 'green' },
  INACTIVE: { label: 'Inactive', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'amber' },
};

export const REVIEW_STATUS: Record<string, StatusStyle> = {
  PENDING: { label: 'Waiting', tone: 'amber' },
  APPROVED: { label: 'Published', tone: 'green' },
  REJECTED: { label: 'Rejected', tone: 'neutral' },
};

export const CUSTOMER_STATUS: Record<string, StatusStyle> = {
  ACTIVE: { label: 'Active', tone: 'green' },
  BLOCKED: { label: 'Blocked', tone: 'red' },
  DELETED: { label: 'Deleted', tone: 'neutral' },
};

/** Looks up a status style, falling back to a readable neutral badge for unknown values. */
export function statusStyle(map: Record<string, StatusStyle>, value: string | null | undefined): StatusStyle {
  if (value && map[value]) return map[value];
  const text = (value ?? 'Unknown').replace(/_/g, ' ').toLowerCase();
  return { label: text.charAt(0).toUpperCase() + text.slice(1), tone: 'neutral' };
}
