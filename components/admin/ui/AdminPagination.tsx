'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface AdminPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  itemsPerPage?: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function AdminPagination({
  currentPage,
  totalItems,
  pageSize,
  itemsPerPage,
  totalPages: customTotalPages,
  onPageChange,
  className = '',
}: AdminPaginationProps) {
  const effectivePageSize = pageSize || itemsPerPage || 10;
  const totalPages = customTotalPages ?? Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const endItem = Math.min(currentPage * effectivePageSize, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-slate-200 bg-white text-sm text-slate-600 ${className}`}>
      <div>
        Showing <span className="font-medium text-slate-900">{startItem}</span> to{' '}
        <span className="font-medium text-slate-900">{endItem}</span> of{' '}
        <span className="font-medium text-slate-900">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-medium px-2 text-slate-700">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
