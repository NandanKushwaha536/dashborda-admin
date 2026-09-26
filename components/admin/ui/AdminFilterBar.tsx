import React from 'react';

export interface AdminFilterOption {
  label: string;
  value: string;
}

export interface AdminFilterBarProps {
  children: React.ReactNode;
  className?: string;
  onReset?: () => void;
  hasActiveFilters?: boolean;
}

export function AdminFilterBar({
  children,
  className = '',
  onReset,
  hasActiveFilters = false,
}: AdminFilterBarProps) {
  return (
    <div
      className={`p-4 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">{children}</div>
      {hasActiveFilters && onReset && (
        <button
          onClick={onReset}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
