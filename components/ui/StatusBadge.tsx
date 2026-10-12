import React from 'react';
import { Badge } from './Feedback';
import { statusStyle } from '@/lib/status';

/** Badge for any backend status, using the label/colour maps in lib/status.ts. */
export function StatusBadge({
  map,
  value,
  className,
}: {
  map: Parameters<typeof statusStyle>[0];
  value: string | null | undefined;
  className?: string;
}) {
  const style = statusStyle(map, value);
  return (
    <Badge tone={style.tone} className={className}>
      {style.label}
    </Badge>
  );
}
