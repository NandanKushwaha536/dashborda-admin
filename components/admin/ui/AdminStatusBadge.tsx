import React from 'react';

export interface AdminStatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function AdminStatusBadge({ status, className = '', size = 'md' }: AdminStatusBadgeProps) {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  // Orders / General States
  if (['CONFIRMED', 'DELIVERED', 'ACTIVE', 'PAID', 'SUCCESS', 'APPROVED', 'IN_STOCK', 'HEALTHY'].includes(normalized)) {
    colorClasses = 'bg-teal-50 text-teal-800 border-teal-200';
  } else if (['PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'PENDING', 'OPEN', 'REQUESTED'].includes(normalized)) {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
  } else if (['LOW_STOCK', 'WARNING', 'IN_PROGRESS', 'DRAFT', 'DEGRADED'].includes(normalized)) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (['CANCELLED', 'RETURNED', 'FAILED', 'REFUNDED', 'REJECTED', 'OUT_OF_STOCK', 'SUSPENDED', 'BLOCKED', 'DELETED', 'UNHEALTHY', 'NDR', 'RTO'].includes(normalized)) {
    colorClasses = 'bg-red-50 text-red-800 border-red-200';
  } else if (['ARCHIVED', 'CLOSED', 'EXPIRED', 'PAUSED'].includes(normalized)) {
    colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
  }

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  const formattedLabel = normalized.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full tracking-wide capitalize whitespace-nowrap ${sizeClasses} ${colorClasses} ${className}`}
    >
      {formattedLabel}
    </span>
  );
}
