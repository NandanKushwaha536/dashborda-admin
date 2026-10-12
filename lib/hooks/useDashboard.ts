'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList } from '@/lib/api/normalize';

/** GET /admin/dashboard/overview (last 30 days for "period" figures). */
export interface DashboardOverview {
  customers: number;
  activeProducts: number;
  lowStockProducts: number;
  periodOrders: number;
  periodRevenue: number;
  totalRevenue: number;
}

export interface SalesPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  revenue: number;
}

type Raw = Record<string, unknown>;
const obj = (value: unknown): Raw => (value && typeof value === 'object' ? (value as Raw) : {});

export function useDashboardOverview(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: async (): Promise<DashboardOverview> => {
      const res = await api.get<{ data?: Raw }>(ENDPOINTS.dashboard.overview);
      const data = obj(res.data);
      const users = obj(data.users);
      const products = obj(data.products);
      const orders = obj(data.orders);
      const revenue = obj(data.revenue);
      return {
        customers: Number(users.total ?? 0),
        activeProducts: Number(products.active ?? 0),
        lowStockProducts: Number(products.lowStock ?? 0),
        periodOrders: Number(orders.period ?? 0),
        periodRevenue: Number(revenue.period ?? 0),
        totalRevenue: Number(revenue.total ?? 0),
      };
    },
    enabled,
    staleTime: 60_000,
  });
}

/** Daily revenue and orders for the last 30 days, with missing days filled as zero. */
export function useSalesTrend(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.sales('30d'),
    queryFn: async (): Promise<SalesPoint[]> => {
      const res = await api.get<unknown>(ENDPOINTS.dashboard.sales, { params: { days: 30 } });
      const byDate = new Map(
        normalizeList<Raw>(res).map((row) => [String(row.date ?? '').slice(0, 10), { orders: Number(row.orders ?? 0), revenue: Number(row.revenue ?? 0) }])
      );
      const days: SalesPoint[] = [];
      for (let i = 29; i >= 0; i -= 1) {
        // Day keys in India time, matching the backend's grouping.
        const day = new Date(Date.now() + 330 * 60_000 - i * 86_400_000);
        const key = day.toISOString().slice(0, 10);
        days.push({ date: key, orders: byDate.get(key)?.orders ?? 0, revenue: byDate.get(key)?.revenue ?? 0 });
      }
      return days;
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useTopProducts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.topProducts,
    queryFn: async (): Promise<TopProduct[]> => {
      const res = await api.get<unknown>(ENDPOINTS.dashboard.topProducts, { params: { days: 30, limit: 5 } });
      return normalizeList<Raw>(res).map((row) => ({
        id: String(row._id ?? row.productId ?? ''),
        name: String(row.name ?? 'Product'),
        sku: String(row.sku ?? ''),
        quantity: Number(row.quantity ?? 0),
        revenue: Number(row.revenue ?? 0),
      }));
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}
