import React from 'react';
import { PackageOpen } from 'lucide-react';
import { AdminButton } from './AdminButton';

export interface AdminEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function AdminEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: AdminEmptyStateProps) {
  return (
    <div
      className={`py-12 px-6 flex flex-col items-center justify-center text-center max-w-md mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
        {icon || <PackageOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-6">{description}</p>
      {actionLabel && onAction && (
        <AdminButton variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </AdminButton>
      )}
    </div>
  );
}
