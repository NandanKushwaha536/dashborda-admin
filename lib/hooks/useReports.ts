'use client';

import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, api, ApiError } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';

export interface ReportRange {
  /** YYYY-MM-DD */
  from: string;
  /** YYYY-MM-DD */
  to: string;
}

export interface ProfitRow {
  productId: string;
  product: string;
  sku: string;
  unitsSold: number;
  revenue: number;
  /** null when the product has no purchase order to take a cost from. */
  unitCost: number | null;
  cost: number | null;
  profit: number | null;
  marginPercent: number | null;
}

export interface ProfitReport {
  from: string;
  to: string;
  totals: {
    orders: number;
    unitsSold: number;
    revenue: number;
    revenueWithKnownCost: number;
    cost: number;
    profit: number;
    marginPercent: number | null;
    productsWithoutCost: number;
  };
  rows: ProfitRow[];
  warnings: string[];
}

export interface GstGroup {
  key: string;
  quantity: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface GstReport {
  from: string;
  to: string;
  seller: { gstNumber: string; state: string };
  totals: {
    invoices: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    shippingCharged: number;
  };
  byRate: GstGroup[];
  byHsn: GstGroup[];
  byState: GstGroup[];
  warnings: string[];
}

export type CsvReportType =
  | 'orders'
  | 'products'
  | 'customers'
  | 'payments'
  | 'inventory'
  | 'returns'
  | 'shipping'
  | 'refunds';

export function useProfitReport(range: ReportRange, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reports.profit(range.from, range.to),
    queryFn: async () => {
      const res = await api.get<{ data: ProfitReport }>(ENDPOINTS.reports.profit, { params: { ...range } });
      return res.data;
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useGstReport(range: ReportRange, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reports.gst(range.from, range.to),
    queryFn: async () => {
      const res = await api.get<{ data: GstReport }>(ENDPOINTS.reports.gst, { params: { ...range } });
      return res.data;
    },
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Downloads a CSV report produced by the backend. The file comes straight from
 * live data; nothing is generated in the browser.
 */
export async function downloadReportCsv(
  endpoint: string,
  params: Record<string, string | number | undefined>,
  fallbackName: string
): Promise<void> {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.append(key, String(value));
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}?${search.toString()}`, {
    credentials: 'include',
    headers: { Accept: 'text/csv' },
  });

  if (!response.ok) {
    let message = `The report could not be downloaded (error ${response.status}).`;
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      message = body.message || body.error || message;
    } catch {
      // Response was not JSON; keep the generic message.
    }
    throw new ApiError(message, response.status, 'UNKNOWN');
  }

  const disposition = response.headers.get('content-disposition') || '';
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = match?.[1] || fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
