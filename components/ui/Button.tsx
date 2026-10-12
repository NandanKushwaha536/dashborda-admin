'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/format';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100',
  soft: 'border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50',
  ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
};

// md and lg keep a 44px touch target on phones.
const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-11 px-4 text-sm md:h-10',
  lg: 'h-12 px-5 text-[15px]',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string): string {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon, className, children, disabled, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
});

export interface ButtonLinkProps extends Omit<React.ComponentProps<typeof Link>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  className?: string;
}

export function ButtonLink({ variant = 'primary', size = 'md', icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

/**
 * Row actions used in every list: "Edit" and "Delete" always show an icon and
 * a word, so it is clear what each button does. `href` makes Edit a link.
 */
export function EditAction({ href, label = 'Edit', onClick, ...rest }: { href?: string; label?: string; onClick?: () => void } & Omit<ButtonProps, 'children' | 'icon' | 'variant' | 'onClick'>) {
  const icon = <Pencil className="h-3.5 w-3.5" aria-hidden="true" />;
  if (href) {
    return (
      <ButtonLink href={href} variant="secondary" size="sm" icon={icon} className={rest.className}>
        {label}
      </ButtonLink>
    );
  }
  return (
    <Button variant="secondary" size="sm" icon={icon} onClick={onClick} {...rest}>
      {label}
    </Button>
  );
}

export function DeleteAction({ label = 'Delete', className, ...rest }: { label?: string } & Omit<ButtonProps, 'children' | 'icon' | 'variant'>) {
  return (
    <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />} className={cn('text-red-700 hover:bg-red-50', className)} {...rest}>
      {label}
    </Button>
  );
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'light' | 'dark';
}

/** Square 44px icon-only button; `label` is read by screen readers. */
export function IconButton({ label, tone = 'light', className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50',
        tone === 'dark' ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
