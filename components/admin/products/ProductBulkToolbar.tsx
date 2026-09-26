'use client';

import React from 'react';
import { Trash2, CheckSquare, Download, X } from 'lucide-react';
import { AdminButton } from '../ui/AdminButton';

export interface ProductBulkToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onUpdateStatus: (status: string) => void;
  onDeleteSelected: () => void;
  onExportSelected: () => void;
  isLoading?: boolean;
}

export function ProductBulkToolbar({
  selectedCount,
  onClear,
  onUpdateStatus,
  onDeleteSelected,
  onExportSelected,
  isLoading = false,
}: ProductBulkToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center gap-4 pointer-events-auto max-w-2xl w-full justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
            {selectedCount}
          </div>
          <span className="text-xs font-medium text-slate-200">
            {selectedCount === 1 ? '1 product selected' : `${selectedCount} products selected`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status dropdown/buttons */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                onUpdateStatus(e.target.value);
                e.target.value = '';
              }
            }}
            disabled={isLoading}
            className="text-xs bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">Bulk Status...</option>
            <option value="ACTIVE">Set ACTIVE</option>
            <option value="DRAFT">Set DRAFT</option>
            <option value="INACTIVE">Set INACTIVE</option>
          </select>

          <AdminButton
            variant="outline"
            size="sm"
            onClick={onExportSelected}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            Export
          </AdminButton>

          <AdminButton
            variant="danger"
            size="sm"
            onClick={onDeleteSelected}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            isLoading={isLoading}
          >
            Delete
          </AdminButton>

          <button
            onClick={onClear}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Clear Selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
