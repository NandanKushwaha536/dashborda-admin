'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import type { Order, OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/api/types';
import { normalizeLimit, normalizeList, normalizePage, normalizeTotal } from '@/lib/api/normalize';

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus | '';
  paymentStatus?: PaymentStatus | '';
  paymentMethod?: PaymentMethod | '';
  search?: string;
}

type Raw = Record<string, unknown>;

const obj = (value: unknown): Raw => (value && typeof value === 'object' ? (value as Raw) : {});
const str = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined);
const num = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Backend order document (list row or detail) → admin Order. */
export function normalizeOrder(row: Raw): Order {
  const customer = obj(row.user ?? row.customer);
  const address = obj(row.shippingAddress);
  const items = Array.isArray(row.items) ? row.items : [];
  const addressName = [str(address.firstName), str(address.lastName)].filter(Boolean).join(' ') || str(address.name) || '';
  return {
    id: String(row._id ?? row.id ?? ''),
    orderNumber: String(row.orderNumber ?? row._id ?? ''),
    customer: {
      id: String(customer._id ?? customer.id ?? ''),
      name: str(customer.name) ?? (addressName || 'Customer'),
      email: str(customer.email) ?? '',
      phone: str(customer.phone) ?? str(address.phone) ?? '',
    },
    shippingAddress: {
      name: addressName,
      phone: str(address.phone) ?? '',
      addressLine1: str(address.addressLine1) ?? '',
      addressLine2: str(address.addressLine2),
      landmark: str(address.landmark),
      city: str(address.city) ?? '',
      state: str(address.state) ?? '',
      postalCode: str(address.postalCode) ?? '',
      country: str(address.country) ?? 'India',
    },
    items: items.map((value, index) => {
      const item = obj(value);
      const product = obj(item.product);
      const thumbnail = obj(item.thumbnail);
      const unit = num(item.salePrice) > 0 ? num(item.salePrice) : num(item.price);
      const quantity = num(item.quantity);
      return {
        id: String(item._id ?? `${row._id}-${index}`),
        productId: String(product._id ?? item.product ?? ''),
        name: str(item.name) ?? 'Product',
        sku: str(item.sku) ?? '',
        variant: str(item.variantName) ?? str(item.colorName),
        quantity,
        cancelledQuantity: num(item.cancelledQuantity),
        price: unit,
        total: num(item.subtotal) || unit * quantity,
        image: str(thumbnail.url) ?? str(item.thumbnail),
      };
    }),
    subtotal: num(row.subtotal),
    shippingFee: num(row.shippingCharge ?? row.shippingFee),
    tax: num(row.tax),
    discount: num(row.discount),
    totalAmount: num(row.total ?? row.totalAmount),
    couponCode: str(row.couponCode),
    status: String(row.orderStatus ?? row.status ?? 'PENDING') as OrderStatus,
    paymentStatus: String(row.paymentStatus ?? 'PENDING') as PaymentStatus,
    paymentMethod: (row.paymentMethod === 'COD' ? 'COD' : 'ONLINE') as PaymentMethod,
    deliverySpeed: str(row.deliverySpeed),
    placedAt: String(row.createdAt ?? ''),
    updatedAt: String(row.updatedAt ?? row.createdAt ?? ''),
    paidAt: str(row.paidAt),
    shippedAt: str(row.shippedAt),
    outForDeliveryAt: str(row.outForDeliveryAt),
    deliveredAt: str(row.deliveredAt),
    cancelledAt: str(row.cancelledAt),
    returnWindowEndsAt: str(row.returnWindowEndsAt),
    notes: str(row.notes),
    invoiceNumber: str(row.invoiceNumber),
    invoiceUrl: str(row.invoiceUrl),
    invoiceSentAt: str(row.invoiceSentAt),
    cancellationReason: str(row.cancellationReason),
    cancelledAmount: num(row.cancelledAmount),
    cancellationRefundedAmount: num(row.cancellationRefundedAmount),
    cancellationRefundStatus: (str(row.cancellationRefundStatus) ?? 'NOT_REQUIRED') as Order['cancellationRefundStatus'],
  };
}

export function useOrders(filters: OrderFilters) {
  const params = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
    status: filters.status || undefined,
    paymentStatus: filters.paymentStatus || undefined,
    paymentMethod: filters.paymentMethod || undefined,
    search: filters.search?.trim() || undefined,
  };
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.orders.list, { params });
      const orders = normalizeList<Raw>(res, ['orders']).map(normalizeOrder);
      return {
        orders,
        total: normalizeTotal(res, orders.length),
        page: normalizePage(res, params.page),
        limit: normalizeLimit(res, params.limit),
      };
    },
    placeholderData: (previous) => previous,
    staleTime: 15_000,
  });
}

/** Orders per lifecycle stage, e.g. { PENDING: 3, PACKED: 1 }. */
export function useOrderStatusCounts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.orders.counts,
    queryFn: async () => {
      const res = await api.get<{ data?: Record<string, number> }>(ENDPOINTS.orders.statusCounts);
      return (res.data ?? {}) as Partial<Record<OrderStatus, number>>;
    },
    enabled,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: async () => {
      const res = await api.get<{ data?: Raw }>(ENDPOINTS.orders.detail(id));
      return normalizeOrder(res.data ?? (res as Raw));
    },
    enabled: Boolean(id),
    staleTime: 10_000,
  });
}

/** Refreshes everything an order change can affect. */
export function useInvalidateOrders() {
  const queryClient = useQueryClient();
  return (orderId?: string) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    if (orderId) void queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
  };
}

/** Plain order status change (confirm, start picking, mark packed, cancel). */
export function useUpdateOrderStatus() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch<unknown>(ENDPOINTS.orders.updateStatus(id), { status }),
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
}

export function useUpdateOrderNotes() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => api.patch<unknown>(ENDPOINTS.orders.notes(id), { notes }),
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
}

export function useSendInvoice() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (id: string) => api.post<unknown>(ENDPOINTS.orders.invoiceSend(id), {}),
    onSuccess: (_data, id) => invalidate(id),
  });
}

/** Retries a failed refund for items cancelled on a prepaid order. */
export function useRetryCancellationRefund() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (id: string) => api.post<unknown>(ENDPOINTS.orders.retryCancellationRefund(id), {}),
    onSuccess: (_data, id) => invalidate(id),
  });
}
