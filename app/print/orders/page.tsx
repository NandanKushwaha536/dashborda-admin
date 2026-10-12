'use client';

import React, { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeOrder } from '@/lib/hooks/useOrders';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Order } from '@/lib/api/types';
import { formatDateTime, formatINR } from '@/lib/format';
import { paymentMethodLabel } from '@/lib/status';
import { Button } from '@/components/ui/Button';
import { ErrorState, Spinner } from '@/components/ui/Feedback';

/** Every unit to pull from the shelves, grouped by SKU across the chosen orders. */
function PickList({ orders }: { orders: Order[] }) {
  const lines = useMemo(() => {
    const map = new Map<string, { sku: string; name: string; variant?: string; quantity: number; orders: Set<string> }>();
    orders.forEach((order) =>
      order.items.forEach((item) => {
        const quantity = item.quantity - item.cancelledQuantity;
        if (quantity <= 0) return;
        const key = `${item.sku}|${item.variant ?? ''}`;
        const line = map.get(key) ?? { sku: item.sku, name: item.name, variant: item.variant, quantity: 0, orders: new Set<string>() };
        line.quantity += quantity;
        line.orders.add(order.orderNumber);
        map.set(key, line);
      })
    );
    return [...map.values()].sort((a, b) => a.sku.localeCompare(b.sku));
  }, [orders]);

  return (
    <section>
      <h1 className="text-xl font-bold">Pick list</h1>
      <p className="mb-4 text-sm text-slate-600">
        {orders.length} orders · {lines.reduce((sum, line) => sum + line.quantity, 0)} units · printed {formatDateTime(new Date())}
      </p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-900 text-left">
            <th className="w-10 py-2">✓</th>
            <th className="py-2">SKU</th>
            <th className="py-2">Item</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 pl-4">Orders</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={`${line.sku}-${line.variant}`} className="break-inside-avoid border-b border-slate-300 align-top">
              <td className="py-2">
                <span className="inline-block h-4 w-4 border border-slate-700" />
              </td>
              <td className="py-2 font-mono">{line.sku}</td>
              <td className="py-2">
                {line.name}
                {line.variant ? <span className="text-slate-600"> · {line.variant}</span> : null}
              </td>
              <td className="py-2 text-right text-base font-bold">{line.quantity}</td>
              <td className="py-2 pl-4 font-mono text-xs text-slate-600">{[...line.orders].join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** One slip per order to put in the parcel. */
function PackingSlips({ orders }: { orders: Order[] }) {
  return (
    <>
      {orders.map((order) => {
        const address = order.shippingAddress;
        const codDue = order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID';
        return (
          <section key={order.id} className="mb-8 break-after-page border border-slate-400 p-6 last:break-after-auto">
            <div className="flex justify-between gap-6 border-b border-slate-300 pb-4">
              <div>
                <p className="text-lg font-bold">RG Enterprises</p>
                <p className="text-sm text-slate-600">Packing slip</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-mono text-base font-bold">{order.orderNumber}</p>
                <p>{formatDateTime(order.placedAt)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 py-4 text-sm">
              <div>
                <p className="mb-1 font-semibold uppercase tracking-wide text-slate-500">Ship to</p>
                <p className="font-semibold">{address.name}</p>
                <p>{address.addressLine1}</p>
                {address.addressLine2 ? <p>{address.addressLine2}</p> : null}
                {address.landmark ? <p>Near {address.landmark}</p> : null}
                <p>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p>Phone {address.phone}</p>
              </div>
              <div className="text-right">
                <p className="mb-1 font-semibold uppercase tracking-wide text-slate-500">Payment</p>
                <p>{paymentMethodLabel(order.paymentMethod)}</p>
                {codDue ? (
                  <p className="mt-2 inline-block border-2 border-slate-900 px-3 py-1 text-lg font-bold">
                    Collect {formatINR(order.totalAmount - order.cancelledAmount)}
                  </p>
                ) : (
                  <p className="font-semibold">Prepaid</p>
                )}
              </div>
            </div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-900 text-left">
                  <th className="py-2">Item</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {order.items
                  .filter((item) => item.quantity - item.cancelledQuantity > 0)
                  .map((item) => (
                    <tr key={item.id} className="border-b border-slate-200">
                      <td className="py-2">
                        {item.name}
                        {item.variant ? <span className="text-slate-600"> · {item.variant}</span> : null}
                      </td>
                      <td className="py-2 font-mono">{item.sku}</td>
                      <td className="py-2 text-right font-bold">{item.quantity - item.cancelledQuantity}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-slate-500">Thank you for shopping with RG Enterprises.</p>
          </section>
        );
      })}
    </>
  );
}

function PrintView() {
  const params = useSearchParams();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const type = params.get('type') === 'pick' ? 'pick' : 'pack';
  const ids = (params.get('ids') ?? '').split(',').map((id) => id.trim()).filter(Boolean).slice(0, 100);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.orders.detail(id),
      queryFn: async () => {
        const res = await api.get<{ data?: Record<string, unknown> }>(ENDPOINTS.orders.detail(id));
        return normalizeOrder(res.data ?? {});
      },
      enabled: isAuthenticated,
    })),
  });

  if (authLoading || results.some((result) => result.isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }
  if (ids.length === 0) return <ErrorState title="No orders chosen" message="Select orders on the Orders page first." />;
  const failed = results.find((result) => result.error);
  if (failed) return <ErrorState title="Some orders could not be loaded" message={failed.error instanceof Error ? failed.error.message : undefined} />;

  const orders = results.map((result) => result.data).filter((order): order is Order => Boolean(order));

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-slate-900 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <p className="text-sm text-slate-600">{type === 'pick' ? 'Pick list' : 'Packing slips'} for {orders.length} orders</p>
        <Button icon={<Printer className="h-4 w-4" aria-hidden="true" />} onClick={() => window.print()}>
          Print
        </Button>
      </div>
      {type === 'pick' ? <PickList orders={orders} /> : <PackingSlips orders={orders} />}
    </div>
  );
}

export default function PrintOrdersPage() {
  return (
    <Suspense fallback={null}>
      <PrintView />
    </Suspense>
  );
}
