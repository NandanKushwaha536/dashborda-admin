'use client';

import React, { Suspense, useState } from 'react';
import { Download } from 'lucide-react';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { downloadReportCsv, useGstReport, useProfitReport, type CsvReportType, type GstGroup, type ReportRange } from '@/lib/hooks/useReports';
import { useUrlParams } from '@/lib/hooks/useUrlState';
import { cn, errorMessage, formatINR, formatNumber, toDateInputValue } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { Card, PageHeader, Section, StatTile } from '@/components/ui/Layout';
import { Tabs } from '@/components/ui/Navigation';
import { ErrorState, Notice, Skeleton } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Overlay';

type ReportTab = 'profit' | 'gst' | 'exports';

/** Indian financial year starts on 1 April. */
function presets(): Array<{ label: string; range: ReportRange }> {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const day = (date: Date) => toDateInputValue(date);
  const fyStartYear = m >= 3 ? y : y - 1;
  return [
    { label: 'This month', range: { from: day(new Date(y, m, 1)), to: day(now) } },
    { label: 'Last month', range: { from: day(new Date(y, m - 1, 1)), to: day(new Date(y, m, 0)) } },
    { label: 'Last 30 days', range: { from: day(new Date(Date.now() - 29 * 86_400_000)), to: day(now) } },
    { label: 'This financial year', range: { from: day(new Date(fyStartYear, 3, 1)), to: day(now) } },
  ];
}

function useDownload() {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, endpoint: string, params: Record<string, string>, fallback: string) => {
    setBusy(key);
    try {
      await downloadReportCsv(endpoint, params, fallback);
    } catch (error) {
      toast.error(errorMessage(error, 'The file could not be downloaded.'));
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}

function Warnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <Notice tone="warning" title="Check before filing">
      <ul className="list-disc pl-4">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </Notice>
  );
}

function ProfitReport({ range }: { range: ReportRange }) {
  const report = useProfitReport(range);
  const { busy, run } = useDownload();
  if (report.isLoading) return <Skeleton className="h-64 w-full" />;
  if (report.error || !report.data) return <ErrorState message={errorMessage(report.error)} onRetry={() => report.refetch()} />;
  const { totals, rows, warnings } = report.data;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Sales" value={formatINR(totals.revenue)} hint={`${formatNumber(totals.orders)} orders`} />
        <StatTile label="Cost of goods" value={formatINR(totals.cost)} hint={totals.productsWithoutCost ? `${totals.productsWithoutCost} products without cost` : undefined} />
        <StatTile label="Gross profit" value={formatINR(totals.profit)} />
        <StatTile label="Margin" value={totals.marginPercent === null ? '—' : `${totals.marginPercent.toFixed(1)}%`} />
      </div>
      <Warnings warnings={warnings} />
      <Section
        title="By product"
        description="Cost comes from the latest purchase order for each product."
        actions={
          <Button size="sm" variant="secondary" loading={busy === 'profit'} icon={<Download className="h-4 w-4" aria-hidden="true" />} onClick={() => run('profit', ENDPOINTS.reports.profit, { ...range, format: 'csv' }, `profit-${range.from}-${range.to}.csv`)}>
            Download CSV
          </Button>
        }
        bodyClassName="p-0 sm:p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Profit by product</caption>
            <thead>
              <tr className="bg-slate-50 text-left text-[12px] uppercase tracking-wide text-slate-600">
                <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Units</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Sales</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Cost</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Profit</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-600">
                    No sales in this period.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.productId} className="border-t border-slate-100">
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-medium">{row.product}</span>
                        <span className="font-mono text-[12px] text-slate-500">{row.sku}</span>
                      </div>
                    </td>
                    <td className="tabular px-3 py-2.5 text-right">{formatNumber(row.unitsSold)}</td>
                    <td className="tabular px-3 py-2.5 text-right">{formatINR(row.revenue)}</td>
                    <td className="tabular px-3 py-2.5 text-right">{row.cost === null ? <span className="text-amber-700">No cost</span> : formatINR(row.cost)}</td>
                    <td className={cn('tabular px-3 py-2.5 text-right font-semibold', row.profit !== null && row.profit < 0 && 'text-red-700')}>
                      {row.profit === null ? '—' : formatINR(row.profit)}
                    </td>
                    <td className="tabular px-4 py-2.5 text-right">{row.marginPercent === null ? '—' : `${row.marginPercent.toFixed(1)}%`}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function GstTable({ title, groups, keyLabel }: { title: string; groups: GstGroup[]; keyLabel: string }) {
  return (
    <Section title={title} bodyClassName="p-0 sm:p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="bg-slate-50 text-left text-[12px] uppercase tracking-wide text-slate-600">
              <th scope="col" className="px-4 py-3 font-semibold">{keyLabel}</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Qty</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Taxable value</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">CGST</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">SGST</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">IGST</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Total tax</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-600">
                  Nothing in this period.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr key={group.key} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-medium">{group.key}</td>
                  <td className="tabular px-3 py-2.5 text-right">{formatNumber(group.quantity)}</td>
                  <td className="tabular px-3 py-2.5 text-right">{formatINR(group.taxableValue)}</td>
                  <td className="tabular px-3 py-2.5 text-right">{formatINR(group.cgst)}</td>
                  <td className="tabular px-3 py-2.5 text-right">{formatINR(group.sgst)}</td>
                  <td className="tabular px-3 py-2.5 text-right">{formatINR(group.igst)}</td>
                  <td className="tabular px-4 py-2.5 text-right font-semibold">{formatINR(group.totalTax)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function GstReport({ range }: { range: ReportRange }) {
  const report = useGstReport(range);
  const { busy, run } = useDownload();
  if (report.isLoading) return <Skeleton className="h-64 w-full" />;
  if (report.error || !report.data) return <ErrorState message={errorMessage(report.error)} onRetry={() => report.refetch()} />;
  const { totals, seller, warnings } = report.data;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-700">
          Seller GSTIN <span className="font-mono font-semibold">{seller.gstNumber || 'not set'}</span> · State {seller.state || 'not set'}
        </p>
        <Button size="sm" variant="secondary" loading={busy === 'gst'} icon={<Download className="h-4 w-4" aria-hidden="true" />} onClick={() => run('gst', ENDPOINTS.reports.gst, { ...range, format: 'csv' }, `gst-${range.from}-${range.to}.csv`)}>
          Download CSV for your CA
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Invoices" value={formatNumber(totals.invoices)} />
        <StatTile label="Taxable value" value={formatINR(totals.taxableValue)} />
        <StatTile label="Total GST" value={formatINR(totals.totalTax)} hint={`CGST ${formatINR(totals.cgst)} · SGST ${formatINR(totals.sgst)} · IGST ${formatINR(totals.igst)}`} />
        <StatTile label="Shipping charged" value={formatINR(totals.shippingCharged)} />
      </div>
      <Warnings warnings={warnings} />
      <GstTable title="By GST rate" groups={report.data.byRate} keyLabel="Rate" />
      <GstTable title="By HSN code" groups={report.data.byHsn} keyLabel="HSN" />
      <GstTable title="By customer state" groups={report.data.byState} keyLabel="State" />
      <p className="text-[12.5px] text-slate-500">This summary helps prepare GSTR-1 and GSTR-3B. Have a CA or GST practitioner check it before filing.</p>
    </div>
  );
}

const EXPORTS: Array<{ type: CsvReportType; label: string; description: string }> = [
  { type: 'orders', label: 'Orders', description: 'Every order with totals, tax and status.' },
  { type: 'payments', label: 'Payments', description: 'Online payments and their status.' },
  { type: 'refunds', label: 'Refunds', description: 'Money returned to customers.' },
  { type: 'returns', label: 'Returns', description: 'Return requests and outcomes.' },
  { type: 'shipping', label: 'Shipments', description: 'Couriers, AWB numbers and delivery status.' },
  { type: 'products', label: 'Products', description: 'Catalog with prices and stock.' },
  { type: 'inventory', label: 'Inventory', description: 'Stock on hand per product.' },
  { type: 'customers', label: 'Customers', description: 'Customer list (contact details partly hidden).' },
];

function Exports({ range }: { range: ReportRange }) {
  const { busy, run } = useDownload();
  return (
    <Card>
      <ul className="divide-y divide-slate-100">
        {EXPORTS.map((item) => (
          <li key={item.type} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900">{item.label}</span>
              <span className="text-[13px] text-slate-600">{item.description}</span>
            </div>
            <Button size="sm" variant="secondary" loading={busy === item.type} icon={<Download className="h-4 w-4" aria-hidden="true" />} onClick={() => run(item.type, ENDPOINTS.reports.csv, { type: item.type, ...range }, `${item.type}-${range.from}-${range.to}.csv`)}>
              CSV
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ReportsView() {
  const options = presets();
  const [query, setQuery] = useUrlParams(['tab', 'from', 'to'] as const);
  const tab = (query.tab || 'profit') as ReportTab;
  const range: ReportRange = { from: query.from || options[0].range.from, to: query.to || options[0].range.to };
  const valid = range.from <= range.to;

  return (
    <>
      <PageHeader title="Reports" description="Profit, GST and data exports from live orders." />
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick date ranges">
            {options.map((option) => {
              const on = option.range.from === range.from && option.range.to === range.to;
              return (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setQuery(option.range)}
                  className={cn('h-10 rounded-full border px-3.5 text-[13.5px]', on ? 'border-nav-active bg-nav-active font-semibold text-white' : 'border-slate-300 bg-white font-medium text-slate-700 hover:bg-slate-50')}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:w-80">
            <Input label="From" type="date" value={range.from} max={range.to} onChange={(event) => setQuery({ from: event.target.value })} />
            <Input label="To" type="date" value={range.to} min={range.from} onChange={(event) => setQuery({ to: event.target.value })} />
          </div>
        </div>
      </Card>
      <Tabs<ReportTab>
        label="Report"
        value={tab}
        onChange={(value) => setQuery({ tab: value === 'profit' ? null : value })}
        items={[
          { value: 'profit', label: 'Profit' },
          { value: 'gst', label: 'GST summary' },
          { value: 'exports', label: 'Data exports' },
        ]}
      />
      {!valid ? (
        <Notice tone="warning">The start date must be before the end date.</Notice>
      ) : tab === 'profit' ? (
        <ProfitReport range={range} />
      ) : tab === 'gst' ? (
        <GstReport range={range} />
      ) : (
        <Exports range={range} />
      )}
    </>
  );
}

export default function ReportsPage() {
  return (
    <Restricted permission={PERMISSIONS.FINANCE_RECONCILE}>
      <Suspense fallback={null}>
        <ReportsView />
      </Suspense>
    </Restricted>
  );
}
