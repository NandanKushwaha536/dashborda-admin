import React from 'react';

export function AdminSkeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

export function AdminTableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full space-y-3 p-4">
      <div className="flex items-center space-x-4 border-b border-slate-100 pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <AdminSkeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center space-x-4 py-2">
          {Array.from({ length: columns }).map((_, c) => (
            <AdminSkeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <AdminSkeleton className="h-4 w-1/3" />
      <AdminSkeleton className="h-8 w-1/2" />
      <AdminSkeleton className="h-3 w-1/4" />
    </div>
  );
}
