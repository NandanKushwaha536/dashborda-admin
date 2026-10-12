import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/format';
import { BackButton } from './BackButton';

/** White panel used for every content block. */
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('rounded-xl border border-slate-200 bg-white', className)} {...rest}>
      {children}
    </section>
  );
}

/** Titled card section (a form group or a detail block). */
export function Section({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description ? <p className="text-[13px] text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className={cn('px-4 pb-4 pt-4 sm:px-5 sm:pb-5', bodyClassName)}>{children}</div>
    </Card>
  );
}

/** Page title row: back link, title, one line of context and the page actions. */
export function PageHeader({
  title,
  description,
  actions,
  badge,
  back,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  /** Back link target; by default the parent page (none on the dashboard). */
  back?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <BackButton href={back?.href} label={back?.label} />
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 md:text-2xl">{title}</h1>
          {badge}
        </div>
        {description ? <p className="max-w-3xl text-sm text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Label/value pairs for detail pages. */
export function DetailList({ items, className }: { items: Array<{ label: string; value: React.ReactNode }>; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-[12.5px] font-medium text-slate-500">{item.label}</dt>
          <dd className="break-words text-sm text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Number tile. Pass `onClick` or `href` to make the whole tile a control. */
export function StatTile({
  label,
  value,
  hint,
  active = false,
  onClick,
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const classes = cn(
    'flex min-h-[88px] flex-col gap-1 rounded-xl border bg-white p-4 text-left transition-colors',
    active ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200',
    (onClick || href) && 'hover:border-indigo-300'
  );
  const body = (
    <>
      <span className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-600">{label}</span>
      <span className="tabular text-2xl font-bold leading-tight text-slate-900 md:text-[28px]">{value}</span>
      {hint ? <span className="text-[12.5px] font-medium text-indigo-700">{hint}</span> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} aria-pressed={active}>
        {body}
      </button>
    );
  }
  return <div className={classes}>{body}</div>;
}
