'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { Order, OrderStatus } from '@/lib/api/types';
import { normalizeList, normalizeTotal, normalizePage, normalizeLimit } from '@/lib/api/normalize';

export interface OrderFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useOrders(params: OrderFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.orders.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: Order[];
        orders?: Order[];
        total?: number;
        page?: number;
        limit?: number;
      }>(ENDPOINTS.orders.list, {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          status: params.status || undefined,
          paymentStatus: params.paymentStatus || undefined,
          search: params.search || undefined,
          startDate: params.startDate || undefined,
          endDate: params.endDate || undefined,
          sortBy: params.sortBy || undefined,
          sortOrder: params.sortOrder || undefined,
        },
      });

      const rawOrders = normalizeList<Record<string, unknown>>(res, ['orders']);
      const ordersList: Order[] = rawOrders.map((row) => {
        const customerRaw = row.customer;
        const customer = customerRaw && typeof customerRaw === 'object'
          ? customerRaw as Record<string, unknown>
          : undefined;
        const rawItems = Array.isArray(row.items) ? row.items : [];
        return {
          id: String(row._id ?? row.id ?? ''),
          orderNumber: String(row.orderNumber ?? row.orderNo ?? row.number ?? row._id ?? row.id ?? ''),
          customer: {
            id: String(customer?.['_id'] ?? customer?.['id'] ?? row.customerId ?? ''),
            name: String(customer?.['name'] ?? row.customerName ?? 'Guest Customer'),
            email: String(customer?.['email'] ?? row.customerEmail ?? ''),
            phone: String(customer?.['phone'] ?? row.customerPhone ?? '—'),
            city: typeof customer?.['city'] === 'string' ? customer['city'] : undefined,
            state: typeof customer?.['state'] === 'string' ? customer['state'] : undefined,
          },
          shippingAddress: (row.shippingAddress && typeof row.shippingAddress === 'object' ? row.shippingAddress : {}) as Order['shippingAddress'],
          items: rawItems.map((item, index) => {
            const i = item && typeof item === 'object' ? item as Record<string, unknown> : {};
            return {
              id: String(i._id ?? i.id ?? `${row._id ?? row.id}-item-${index}`),
              productId: String(i.productId ?? i.product ?? ''),
              name: String(i.name ?? i.productName ?? 'Product'),
              sku: String(i.sku ?? ''),
              variant: typeof i.variant === 'string' ? i.variant : undefined,
              quantity: Number(i.quantity ?? 0),
              price: Number(i.price ?? i.unitPrice ?? 0),
              total: Number(i.total ?? i.lineTotal ?? 0),
              image: typeof i.image === 'string' ? i.image : undefined,
            };
          }),
          subtotal: Number(row.subtotal ?? 0),
          shippingFee: Number(row.shippingFee ?? row.shippingCharge ?? 0),
          tax: Number(row.tax ?? 0),
          discount: Number(row.discount ?? 0),
          totalAmount: Number(row.totalAmount ?? row.total ?? 0),
          status: String(row.status ?? row.orderStatus ?? 'PENDING') as Order['status'],
          paymentStatus: String(row.paymentStatus ?? 'PENDING') as Order['paymentStatus'],
          paymentMethod: String(row.paymentMethod ?? 'COD') as Order['paymentMethod'],
          placedAt: String(row.placedAt ?? row.createdAt ?? new Date().toISOString()),
          updatedAt: String(row.updatedAt ?? row.createdAt ?? new Date().toISOString()),
          notes: typeof row.notes === 'string' ? row.notes : undefined,
          trackingNumber: typeof row.trackingNumber === 'string' ? row.trackingNumber : undefined,
          courier: typeof row.courier === 'string' ? row.courier : undefined,
          timeline: Array.isArray(row.timeline) ? row.timeline as Order['timeline'] : [],
          invoiceNumber: typeof row.invoiceNumber === 'string' ? row.invoiceNumber : undefined,
          invoiceUrl: typeof row.invoiceUrl === 'string' ? row.invoiceUrl : undefined,
        };
      });
      return {
        orders: ordersList,
        total: normalizeTotal(res, ordersList.length),
        page: normalizePage(res, params.page ?? 1),
        limit: normalizeLimit(res, params.limit ?? 20),
      };
    },
    staleTime: 15_000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: async () => {
      const res = await api.get<{ success?: boolean; data?: Order; order?: Order }>(
        ENDPOINTS.orders.detail(id)
      );
      return res.data || res.order || (res as unknown as Order);
    },
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    // Backend mounts this route as router.patch('/:id/status', ...), not PUT.
    mutationFn: async ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) => {
      return api.patch<{ success: boolean; data: Order }>(ENDPOINTS.orders.updateStatus(id), {
        status,
        reason,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
}

// The backend has no standalone "cancel by id" route for admins — order
// cancellation is done through the same status-update endpoint with
// { status: 'CANCELLED' }. ENDPOINTS.orders.cancel does not exist; using it
// here was a dead reference to an endpoint the backend never implemented.
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return api.patch<{ success: boolean; data: Order }>(ENDPOINTS.orders.updateStatus(id), {
        status: 'CANCELLED' as OrderStatus,
        reason,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
  });
}
