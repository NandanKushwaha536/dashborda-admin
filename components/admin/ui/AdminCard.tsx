import React from 'react';

export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function AdminCard({ children, className = '', ...props }: AdminCardProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({
  title,
  subtitle,
  description,
  action,
  className = '',
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const subText = subtitle ?? description;
  return (
    <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subText && <p className="text-xs text-slate-500 mt-0.5">{subText}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function AdminCardBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function AdminCardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}
