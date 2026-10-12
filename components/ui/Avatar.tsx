'use client';

import React from 'react';
import { cn, initials } from '@/lib/format';

/** Round profile picture; falls back to initials when there is no photo or it fails to load. */
export function Avatar({ name, src, size = 'md', className }: { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const [broken, setBroken] = React.useState(false);
  React.useEffect(() => setBroken(false), [src]);
  const dimension = { sm: 'h-9 w-9 text-[13px]', md: 'h-12 w-12 text-base', lg: 'h-20 w-20 text-2xl' }[size];
  return src && !broken ? (
    // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL from the backend; no next/image loader configured.
    <img src={src} alt="" onError={() => setBroken(true)} className={cn('shrink-0 rounded-full object-cover ring-1 ring-slate-200', dimension, className)} />
  ) : (
    <span aria-hidden="true" className={cn('flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-800', dimension, className)}>
      {initials(name)}
    </span>
  );
}
