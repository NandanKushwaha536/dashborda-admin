'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { useOrderStatusCounts } from '@/lib/hooks/useOrders';
import { useDashboardOverview, useSalesTrend, useTopProducts } from '@/lib/hooks/useDashboard';
import { useInventory } from '@/lib/hooks/useInventory';
import { errorMessage, formatINR, formatNumber } from '@/lib/format';
import { Card, PageHeader, Section, StatTile } from '@/components/ui/Layout';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { ButtonLink } from '@/components/ui/Button';
import { SalesChart } from '@/components/dashboard/SalesChart';

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()));
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const QUEUE = [
  { status: 'PENDING', label: 'To confirm' },
  { status: 'CONFIRMED', label: 'To pick' },
  { status: 'PROCESSING', label: 'To pack' },
  { status: 'PACKED', label: 'To ship' },
] as const;

export default function DashboardPage() {
  const { user, can } = useAuth();
  const canOrders = can(PERMISSIONS.ORDERS_READ);
  const canReports = can(PERMISSIONS.REPORTS_READ);
  const canInventory = can(PERMISSIONS.INVENTORY_READ);
  const counts = useOrderStatusCounts(canOrders);
  const overview = useDashboardOverview(canReports);
  const sales = useSalesTrend(canReports);
  const top = useTopProducts(canReports);
  const lowStock = useInventory({ page: 1, limit: 5, threshold: 5, enabled: canInventory });

  const average = overview.data && overview.data.periodOrders > 0 ? overview.data.periodRevenue / overview.data.periodOrders : 0;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.name.split(' ')[0] ?? ''}`}
        description="Here is what needs you today and how the last 30 days went."
        actions={
          can(PERMISSIONS.PRODUCTS_WRITE) ? (
            <ButtonLink href="/admin/products/new" variant="secondary" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              Add product
            </ButtonLink>
          ) : null
        }
      />

      {canOrders ? (
        <section aria-labelledby="queue-title" className="flex flex-col gap-3">
          <h2 id="queue-title" className="text-sm font-semibold uppercase tracking-wider text-slate-600">
            Orders waiting for you
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {QUEUE.map((item) => (
              <StatTile
                key={item.status}
                label={item.label}
                value={counts.data ? counts.data[item.status] ?? 0 : '—'}
                hint="Open list"
                href={`/admin/orders?stage=${item.status}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {canReports ? (
        <>
          <section aria-labelledby="kpi-title" className="flex flex-col gap-3">
            <h2 id="kpi-title" className="text-sm font-semibold uppercase tracking-wider text-slate-600">
              Last 30 days
            </h2>
            {overview.error ? (
              <Card>
                <ErrorState message={errorMessage(overview.error)} onRetry={() => overview.refetch()} />
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label="Sales" value={overview.data ? formatINR(overview.data.periodRevenue) : '—'} />
                <StatTile label="Orders" value={overview.data ? formatNumber(overview.data.periodOrders) : '—'} />
                <StatTile label="Average order" value={overview.data ? formatINR(average) : '—'} />
                <StatTile label="Customers" value={overview.data ? formatNumber(overview.data.customers) : '—'} hint="All time" />
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Section title="Daily sales" description="Revenue from paid, not-cancelled orders.">
              {sales.isLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : sales.error ? (
                <ErrorState message={errorMessage(sales.error)} onRetry={() => sales.refetch()} />
              ) : sales.data && sales.data.some((d) => d.revenue > 0) ? (
                <SalesChart data={sales.data} />
              ) : (
                <EmptyState title="No sales in the last 30 days" className="py-8" />
              )}
            </Section>

            <Section title="Best sellers" description="By units, last 30 days.">
              {top.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : top.data && top.data.length > 0 ? (
                <ol className="flex flex-col divide-y divide-slate-100">
                  {top.data.map((product, index) => (
                    <li key={`${product.id}-${index}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span className="tabular w-5 text-sm font-semibold text-slate-400">{index + 1}</span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-slate-900">{product.name}</span>
                        <span className="font-mono text-[12px] text-slate-500">{product.sku}</span>
                      </div>
                      <div className="flex flex-col items-end text-sm">
                        <span className="tabular font-semibold">{formatNumber(product.quantity)} sold</span>
                        <span className="tabular text-[12px] text-slate-500">{formatINR(product.revenue)}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState title="No sales yet" className="py-8" />
              )}
            </Section>
          </div>
        </>
      ) : null}

      {canInventory ? (
        <Section
          title="Running low"
          description="Products with 5 or fewer units."
          actions={
            <Link href="/admin/inventory?view=low" className="text-sm font-semibold text-indigo-700 hover:underline">
              See all
            </Link>
          }
        >
          {lowStock.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : lowStock.data && lowStock.data.items.length > 0 ? (
            <ul className="flex flex-col divide-y divide-slate-100">
              {lowStock.data.items.map((item) => (
                <li key={item._id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{item.productName}</span>
                    <span className="font-mono text-[12px] text-slate-500">{item.sku}</span>
                  </div>
                  <span className={`tabular text-sm font-semibold ${item.available <= 0 ? 'text-red-700' : 'text-amber-700'}`}>
                    {item.available <= 0 ? 'Out of stock' : `${item.available} left`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">Every product has enough stock.</p>
          )}
        </Section>
      ) : null}
    </>
  );
}
