'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { DashboardStats } from '@/lib/api/types';
import { normalizeList } from '@/lib/api/normalize';

// Raw shape returned by GET /admin/dashboard/overview — nested by domain,
// not the flat DashboardStats shape the UI wants.
export interface RawDashboardOverview {
  users?: { total?: number; active?: number; new?: number };
  products?: { total?: number; active?: number; lowStock?: number; outOfStock?: number };
  orders?: {
    total?: number;
    pending?: number;
    confirmed?: number;
    delivered?: number;
    cancelled?: number;
    today?: number;
    period?: number;
  };
  revenue?: { total?: number; period?: number; today?: number };
}

export interface ComprehensiveDashboardData {
  // Orders
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  // Products
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  // Customers
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  // Financial
  totalRevenue: number;
  periodRevenue: number;
  refundsTotal: number;
  paymentsCount: number;
  // Pending actions count
  pendingActions: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: async () => {
      // Fetch overview, finance summary, and inventory out-of-stock in parallel
      const [overviewRes, financeRes] = await Promise.all([
        api.get<{ success?: boolean; data?: RawDashboardOverview }>(ENDPOINTS.dashboard.overview).catch(() => ({ data: {} as RawDashboardOverview })),
        api.get<{ success?: boolean; data?: { grossRevenue?: number; refundsTotal?: number } }>(ENDPOINTS.finance.summary).catch(() => ({ data: {} as { grossRevenue?: number; refundsTotal?: number } })),
      ]);

      const overview: RawDashboardOverview = (overviewRes.data || (overviewRes as unknown as RawDashboardOverview)) || {};
      const finance: { grossRevenue?: number; refundsTotal?: number } = financeRes.data || {};

      const stats: DashboardStats = {
        totalRevenue: overview.revenue?.total ?? finance.grossRevenue ?? 0,
        totalOrders: overview.orders?.total ?? 0,
        customers: overview.users?.total ?? 0,
        pendingOrders: overview.orders?.pending ?? 0,
        lowStockCount: overview.products?.lowStock ?? 0,
      };
      return stats;
    },
    staleTime: 30_000,
  });
}

export function useDetailedDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'detailed-metrics'],
    queryFn: async (): Promise<ComprehensiveDashboardData> => {
      const [overviewRes, financeRes, lowStockRes, outOfStockRes, recentOrdersRes] = await Promise.all([
        api.get<{ success?: boolean; data?: RawDashboardOverview }>(ENDPOINTS.dashboard.overview).catch(() => ({ data: {} as RawDashboardOverview })),
        api.get<{ success?: boolean; data?: { grossRevenue?: number; refundsTotal?: number } }>(ENDPOINTS.finance.summary).catch(() => ({ data: {} as { grossRevenue?: number; refundsTotal?: number } })),
        api.get<{ total?: number }>(ENDPOINTS.inventory.overview, { params: { status: 'LOW_STOCK', limit: 1 } }).catch(() => ({ total: 0 })),
        api.get<{ total?: number }>(ENDPOINTS.inventory.overview, { params: { status: 'OUT_OF_STOCK', limit: 1 } }).catch(() => ({ total: 0 })),
        api.get<{ total?: number; orders?: Array<{ status?: string }> }>(ENDPOINTS.orders.list, { params: { limit: 100 } }).catch(() => ({ total: 0, orders: [] })),
      ]);

      const overview: RawDashboardOverview = (overviewRes.data || (overviewRes as unknown as RawDashboardOverview)) || {};
      const finance: { grossRevenue?: number; refundsTotal?: number } = financeRes.data || {};

      const ordersList = recentOrdersRes.orders || [];
      const confirmedFromList = ordersList.filter((o) => o.status === 'CONFIRMED' || o.status === 'PROCESSING').length;
      const deliveredFromList = ordersList.filter((o) => o.status === 'DELIVERED').length;
      const cancelledFromList = ordersList.filter((o) => o.status === 'CANCELLED').length;

      const lowStockCount = overview.products?.lowStock ?? (lowStockRes.total ?? 0);
      const outOfStockCount = overview.products?.outOfStock ?? (outOfStockRes.total ?? 0);
      const pendingOrders = overview.orders?.pending ?? ordersList.filter((o) => o.status === 'PENDING').length;

      const data: ComprehensiveDashboardData = {
        totalOrders: overview.orders?.total ?? recentOrdersRes.total ?? 0,
        todayOrders: overview.orders?.today ?? 0,
        pendingOrders,
        confirmedOrders: overview.orders?.confirmed ?? confirmedFromList,
        deliveredOrders: overview.orders?.delivered ?? deliveredFromList,
        cancelledOrders: overview.orders?.cancelled ?? cancelledFromList,
        totalProducts: overview.products?.total ?? 0,
        activeProducts: overview.products?.active ?? 0,
        lowStockCount,
        outOfStockCount,
        totalCustomers: overview.users?.total ?? 0,
        newCustomers: overview.users?.new ?? 0,
        activeCustomers: overview.users?.active ?? overview.users?.total ?? 0,
        totalRevenue: overview.revenue?.total ?? finance.grossRevenue ?? 0,
        periodRevenue: overview.revenue?.period ?? 0,
        refundsTotal: finance.refundsTotal ?? 0,
        paymentsCount: overview.orders?.total ?? recentOrdersRes.total ?? 0,
        pendingActions: pendingOrders + lowStockCount,
      };

      return data;
    },
    staleTime: 30_000,
  });
}

export function useDashboardSales(period: string = '30d', customDates?: { start?: string; end?: string }) {
  return useQuery({
    queryKey: queryKeys.dashboard.sales(`${period}-${customDates?.start || ''}-${customDates?.end || ''}`),
    queryFn: async () => {
      const params: Record<string, string> = { period };
      if (customDates?.start) params.startDate = customDates.start;
      if (customDates?.end) params.endDate = customDates.end;

      const res = await api.get<{ success?: boolean; data?: Array<{ date: string; revenue: number; orders: number }> }>(
        ENDPOINTS.dashboard.sales,
        { params }
      );
      return normalizeList<{ date: string; revenue: number; orders: number }>(res);
    },
    staleTime: 60_000,
  });
}

// Raw shape of one row from GET /admin/audit-logs (populated audit doc).
interface RawAuditLogEntry {
  _id?: string;
  id?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  actor?: { name?: string; email?: string; role?: string } | null;
  createdAt?: string;
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.activity,
    queryFn: async () => {
      // ENDPOINTS.dashboard.activity never existed on the backend. The
      // closest real data source is the audit log stream, so the "Recent
      // Activity" widget is built from the latest audit entries instead.
      const res = await api.get<{
        success?: boolean;
        data?: RawAuditLogEntry[];
        logs?: RawAuditLogEntry[];
      }>(ENDPOINTS.audit.logs, { params: { limit: 10, page: 1 } });

      const rows = normalizeList<RawAuditLogEntry>(res, ['logs']);

      return rows.map((row) => {
        const actorName = row.actor?.name || row.actor?.email || 'System';
        return {
          id: row._id || row.id || `${row.action}-${row.createdAt}`,
          type: (row.action || 'UPDATE').replace(/_/g, ' '),
          description: `${actorName} — ${row.resource || 'record'}${
            row.resourceId ? ` #${row.resourceId}` : ''
          }`,
          timestamp: row.createdAt || new Date().toISOString(),
        };
      });
    },
    staleTime: 30_000,
  });
}
