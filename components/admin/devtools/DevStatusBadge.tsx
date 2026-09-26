'use client';

import React from 'react';

export type DevStatusType =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'ERROR'
  | 'DISABLED'
  | 'UNKNOWN'
  | 'CONFIGURED'
  | 'NOT_IMPLEMENTED';

interface DevStatusBadgeProps {
  status: DevStatusType | string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function DevStatusBadge({ status, size = 'sm', pulse = false }: DevStatusBadgeProps) {
  const norm = (status || 'UNKNOWN').toUpperCase();

  let bg = 'bg-slate-800 text-slate-300 border-slate-700';
  let dot = 'bg-slate-400';
  let label = norm;

  switch (norm) {
    case 'HEALTHY':
    case 'OK':
    case 'CONNECTED':
    case 'ACTIVE':
    case 'CONFIGURED':
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dot = 'bg-emerald-500';
      label = norm === 'OK' ? 'HEALTHY' : norm;
      break;
    case 'DEGRADED':
    case 'WARNING':
      bg = 'bg-amber-50 text-amber-700 border-amber-200';
      dot = 'bg-amber-500';
      break;
    case 'ERROR':
    case 'FAILED':
    case 'UNREACHABLE':
      bg = 'bg-rose-50 text-rose-700 border-rose-200';
      dot = 'bg-rose-500';
      break;
    case 'DISABLED':
      bg = 'bg-slate-100 text-slate-500 border-slate-200';
      dot = 'bg-slate-400';
      break;
    case 'NOT_IMPLEMENTED':
    case 'UNAVAILABLE':
      bg = 'bg-blue-50 text-blue-700 border-blue-200';
      dot = 'bg-blue-500';
      label = 'NOT IMPLEMENTED';
      break;
    default:
      bg = 'bg-slate-100 text-slate-700 border-slate-200';
      dot = 'bg-slate-400';
      label = norm;
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border whitespace-nowrap ${padding} ${bg}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dot} ${
          pulse && (norm === 'HEALTHY' || norm === 'DEGRADED') ? 'animate-pulse' : ''
        }`}
      />
      {label}
    </span>
  );
}
