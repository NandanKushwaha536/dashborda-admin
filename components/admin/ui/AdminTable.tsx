import React from 'react';

export interface AdminTableProps {
  headers: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
}

export function AdminTable({ headers, children, className = '' }: AdminTableProps) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
      </table>
    </div>
  );
}

export function AdminTableRow({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${
        onClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/50'
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function AdminTableCell({
  children,
  className = '',
  colSpan,
  align,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  align?: 'left' | 'center' | 'right';
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : '';
  return (
    <td colSpan={colSpan} className={`px-4 py-3.5 text-slate-700 align-middle ${alignClass} ${className}`}>
      {children}
    </td>
  );
}
