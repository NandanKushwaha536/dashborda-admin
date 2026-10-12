'use client';

import React from 'react';
import { cn } from '@/lib/format';
import { EmptyState, ErrorState, ListSkeleton } from './Feedback';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export interface Selection {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  /** Phone layout for one row. `select` is the checkbox to place in the card, when selection is on. */
  mobileCard: (row: T, select: React.ReactNode) => React.ReactNode;
  caption: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty: { title: string; description?: React.ReactNode; action?: React.ReactNode };
  selection?: Selection;
  minWidth?: number;
}

/**
 * One list component for the whole admin: a table from md up, cards on phones.
 * Loading, error and empty states are built in so every list behaves the same.
 */
export function DataTable<T>({
  rows,
  columns,
  getRowId,
  mobileCard,
  caption,
  loading = false,
  error,
  onRetry,
  empty,
  selection,
  minWidth = 860,
}: DataTableProps<T>) {
  if (loading) return <ListSkeleton />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (rows.length === 0) return <EmptyState title={empty.title} description={empty.description} action={empty.action} />;

  // Tables wider than a tablet screen switch to cards until there is room for every column.
  const wide = minWidth > 720;
  const ids = rows.map(getRowId);
  const allSelected = selection ? ids.length > 0 && ids.every((id) => selection.selected.has(id)) : false;

  const toggle = (id: string) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selection.onChange(next);
  };

  const toggleAll = () => {
    if (!selection) return;
    selection.onChange(allSelected ? new Set() : new Set(ids));
  };

  const checkbox = (id: string, label: string) => (
    <input
      type="checkbox"
      aria-label={label}
      checked={selection?.selected.has(id) ?? false}
      onChange={() => toggle(id)}
      className="h-5 w-5 cursor-pointer rounded border-slate-300 accent-indigo-600 md:h-4 md:w-4"
    />
  );

  return (
    <>
      {/* Wide tables need the room left beside the sidebar on a laptop (xl); below that the card list is used,
          so tablets never cut off the last column. */}
      <div className={cn('hidden overflow-x-auto', wide ? 'xl:block' : 'md:block')}>
        <table className="w-full border-collapse text-sm" style={{ minWidth }}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-slate-50 text-left text-[12px] uppercase tracking-wide text-slate-600">
              {selection ? (
                <th scope="col" className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                  />
                </th>
              ) : null}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn('px-3 py-3 font-semibold first:pl-4 last:pr-4', column.align === 'right' && 'text-right', column.className)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = getRowId(row);
              const isSelected = selection?.selected.has(id) ?? false;
              return (
                <tr key={id} className={cn('border-t border-slate-100 align-middle hover:bg-slate-50/70', isSelected && 'bg-indigo-50/60')}>
                  {selection ? <td className="px-4 py-3">{checkbox(id, 'Select row')}</td> : null}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('px-3 py-3 first:pl-4 last:pr-4', column.align === 'right' && 'text-right', column.className)}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className={cn('flex flex-col gap-3 p-3', wide ? 'xl:hidden' : 'md:hidden')} aria-label={caption}>
        {selection ? (
          <li className="flex items-center justify-between px-1">
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-5 w-5 cursor-pointer rounded border-slate-300 accent-indigo-600"
              />
              Select all on this page
            </label>
          </li>
        ) : null}
        {rows.map((row) => {
          const id = getRowId(row);
          const isSelected = selection?.selected.has(id) ?? false;
          return (
            <li
              key={id}
              className={cn('rounded-xl border bg-white p-4', isSelected ? 'border-indigo-400' : 'border-slate-200')}
            >
              {mobileCard(row, selection ? checkbox(id, 'Select') : null)}
            </li>
          );
        })}
      </ul>
    </>
  );
}
