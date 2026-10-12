'use client';

import React, { useMemo, useState } from 'react';
import type { SalesPoint } from '@/lib/hooks/useDashboard';
import { formatINR, formatNumber } from '@/lib/format';

const dayLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** A tidy upper bound for the axis: 1, 2 or 5 × a power of ten. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * power >= value) ?? 10;
  return step * power;
}

/**
 * Daily revenue for 30 days. One series (no legend; the title names it),
 * thin bars with rounded tops, a hover/focus tooltip and a table for screen readers.
 */
export function SalesChart({ data }: { data: SalesPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = useMemo(() => niceMax(Math.max(...data.map((d) => d.revenue), 0)), [data]);
  const point = active !== null ? data[active] : null;
  const ticks = [max, max / 2, 0];

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex h-52 gap-3">
        <div className="flex w-14 shrink-0 flex-col justify-between pb-6 text-right text-[11.5px] text-slate-500" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} className="tabular -translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {tick >= 1000 ? `₹${formatNumber(tick / 1000)}k` : `₹${formatNumber(tick)}`}
            </span>
          ))}
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick} className="block border-t border-slate-100 last:border-slate-300" />
            ))}
          </div>
          <div className="relative flex flex-1 items-end gap-[2px] pb-px" onMouseLeave={() => setActive(null)}>
            {data.map((day, index) => {
              const height = (day.revenue / max) * 100;
              return (
                <button
                  key={day.date}
                  type="button"
                  aria-label={`${dayLabel(day.date)}: ${formatINR(day.revenue)} from ${day.orders} orders`}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  className="group flex h-full flex-1 items-end focus-visible:outline-offset-0"
                >
                  <span
                    className={`block w-full rounded-t-[4px] transition-colors ${active === index ? 'bg-indigo-700' : 'bg-indigo-500'}`}
                    style={{ height: `${Math.max(height, day.revenue > 0 ? 2 : 0)}%` }}
                  />
                </button>
              );
            })}
          </div>
          <div className="flex h-6 items-end justify-between text-[11.5px] text-slate-500" aria-hidden="true">
            <span>{data[0] ? dayLabel(data[0].date) : ''}</span>
            <span>{data[Math.floor(data.length / 2)] ? dayLabel(data[Math.floor(data.length / 2)].date) : ''}</span>
            <span>{data.at(-1) ? dayLabel(data.at(-1)!.date) : ''}</span>
          </div>
          {point && active !== null ? (
            <div
              role="status"
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-[12.5px] text-white shadow-lg"
              style={{ left: `${((active + 0.5) / data.length) * 100}%` }}
            >
              <p className="font-semibold">{dayLabel(point.date)}</p>
              <p className="tabular">{formatINR(point.revenue)}</p>
              <p className="tabular text-slate-300">{point.orders} orders</p>
            </div>
          ) : null}
        </div>
      </div>
      <table className="sr-only">
        <caption>Daily sales, last 30 days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Revenue</th>
            <th scope="col">Orders</th>
          </tr>
        </thead>
        <tbody>
          {data.map((day) => (
            <tr key={day.date}>
              <td>{dayLabel(day.date)}</td>
              <td>{formatINR(day.revenue)}</td>
              <td>{day.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
