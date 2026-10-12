'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { cn, formatNumber } from '@/lib/format';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/**
 * Stage tabs. Chips on phones (scroll sideways), underline tabs from md up.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'scrollbar-none flex gap-2 overflow-x-auto px-3 pb-1 md:gap-1 md:border-b md:border-slate-200 md:pb-0',
        className
      )}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.value)}
            className={cn(
              'flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[13.5px] transition-colors',
              'md:h-12 md:rounded-none md:border-0 md:border-b-2 md:px-2.5',
              selected
                ? 'border-nav-active bg-nav-active font-semibold text-white md:border-indigo-600 md:bg-transparent md:text-indigo-900'
                : 'border-slate-300 bg-white font-medium text-slate-700 hover:text-slate-900 md:border-transparent md:bg-transparent'
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span
                className={cn(
                  'tabular rounded-full px-1.5 text-[11.5px] font-semibold',
                  selected ? 'bg-white/20 text-white md:bg-indigo-100 md:text-indigo-800' : 'bg-slate-100 text-slate-600'
                )}
              >
                {formatNumber(item.count)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-[13px] text-slate-600"
    >
      <span className="tabular">
        {total === 0 ? 'No results' : `Showing ${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(total)}`}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="tabular hidden px-1 sm:inline">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </nav>
  );
}

/** Search box with a visible label for screen readers only. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label = 'Search',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <label className={cn('relative block min-w-0', className)}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:h-10 md:text-sm"
      />
    </label>
  );
}

/** Wraps filter controls; stacks on phones, one row on desktop. */
export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end', className)}>{children}</div>;
}
