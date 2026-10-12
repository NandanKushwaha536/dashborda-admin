'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, Package, Search, ShoppingCart, Tag, Users, type LucideIcon } from 'lucide-react';
import { useGlobalSearch, type SearchResult, type SearchResultType } from '@/lib/hooks/useSearch';
import { useDebouncedValue } from '@/lib/hooks/useUrlState';
import { cn } from '@/lib/format';
import { Spinner } from '@/components/ui/Feedback';
import { IconButton } from '@/components/ui/Button';

const TYPE_ICON: Record<SearchResultType, LucideIcon> = {
  Order: ShoppingCart,
  Product: Package,
  Customer: Users,
  Category: Tag,
  Brand: Bookmark,
};

/** Search box + results list; used inline on desktop and full screen on phones and tablets. */
function SearchPanel({ autoFocus = false, onDone, variant }: { autoFocus?: boolean; onDone?: () => void; variant: 'inline' | 'sheet' }) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const debounced = useDebouncedValue(term, 250);
  const search = useGlobalSearch(debounced);
  const results = useMemo(() => search.data ?? [], [search.data]);
  const ready = debounced.trim().length >= 2;

  useEffect(() => setActive(0), [results]);
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // "/" or Ctrl/Cmd+K focuses the desktop search box from anywhere.
  useEffect(() => {
    if (variant !== 'inline') return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [variant]);

  const go = (result: SearchResult) => {
    setOpen(false);
    setTerm('');
    onDone?.();
    router.push(result.href);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(results.length - 1, index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      go(results[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      if (variant === 'sheet') onDone?.();
      else inputRef.current?.blur();
    }
  };

  const showList = (variant === 'sheet' || open) && term.trim().length > 0;

  return (
    <div className={cn('relative', variant === 'inline' ? 'w-full max-w-md' : 'flex min-h-0 flex-1 flex-col')}>
      <label className="relative block">
        <span className="sr-only">Search orders, products and customers</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="Search order no., phone, product, SKU, customer…"
          className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-14 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 md:h-10 md:text-sm"
        />
        {variant === 'inline' ? (
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-300 bg-white px-1.5 text-[11px] font-medium text-slate-500 xl:block">
            Ctrl K
          </kbd>
        ) : null}
      </label>

      {showList ? (
        <div
          className={cn(
            'overflow-y-auto bg-white',
            variant === 'inline'
              ? 'absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] rounded-xl border border-slate-200 shadow-xl'
              : 'mt-3 min-h-0 flex-1'
          )}
        >
          {!ready ? (
            <p className="px-4 py-3 text-sm text-slate-600">Type at least 2 letters.</p>
          ) : search.isLoading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-600">
              <Spinner className="h-4 w-4" /> Searching…
            </div>
          ) : search.error ? (
            <p className="px-4 py-3 text-sm text-red-700">Search is not available right now.</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-600">Nothing found for “{debounced.trim()}”.</p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Search results" className="py-1.5">
              {results.map((result, index) => {
                const Icon = TYPE_ICON[result.type] ?? Search;
                return (
                  <li
                    key={`${result.type}-${result.id}`}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(result)}
                    className={cn('flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2', index === active ? 'bg-indigo-50' : 'hover:bg-slate-50')}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-slate-900">{result.name}</span>
                      <span className="truncate text-[12.5px] text-slate-500">{result.description}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{result.type}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Header search: a box on desktop, an icon that opens a full-screen search on phones and tablets. */
export function GlobalSearch() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  return (
    <>
      <div className="hidden flex-1 justify-center px-4 lg:flex">
        <SearchPanel variant="inline" />
      </div>
      <IconButton label="Search" className="lg:hidden" onClick={() => setSheetOpen(true)}>
        <Search className="h-5 w-5" aria-hidden="true" />
      </IconButton>
      {sheetOpen && mounted
        ? createPortal(
            <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[60] flex flex-col bg-white px-4 pb-4 pt-3 lg:hidden">
              <div className="mb-3 flex items-center gap-2">
                <IconButton label="Close search" onClick={() => setSheetOpen(false)}>
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </IconButton>
                <span className="text-[15px] font-semibold text-slate-900">Search</span>
              </div>
              <SearchPanel variant="sheet" autoFocus onDone={() => setSheetOpen(false)} />
            </div>,
            document.body
          )
        : null}
    </>
  );
}
