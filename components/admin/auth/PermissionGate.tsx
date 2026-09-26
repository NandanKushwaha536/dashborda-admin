'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { AdminRole } from '@/lib/api/types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import Link from 'next/link';

export interface PermissionGateProps {
  children: React.ReactNode;
  requiredPermission?: string;
  allowedRoles?: AdminRole[];
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  requiredPermission,
  allowedRoles,
  fallback,
}: PermissionGateProps) {
  const { user, isLoading, hasPermission, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Super admin always has access
  if (user?.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  const roleAllowed = allowedRoles ? hasRole(allowedRoles) : true;
  const permissionAllowed = requiredPermission ? hasPermission(requiredPermission) : true;

  if (roleAllowed && permissionAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-slate-200">
      <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h2 className="text-base font-semibold text-slate-900 mb-1">
        Restricted Administrative Resource
      </h2>
      <p className="text-xs text-slate-500 max-w-md mb-6">
        Your administrator account ({user?.email || 'Unknown'}) does not possess the authorization
        required for this module.
        {requiredPermission && (
          <span className="block mt-1 font-mono text-[11px] text-slate-600">
            Required Permission: {requiredPermission}
          </span>
        )}
      </p>
      <Link href="/admin">
        <AdminButton variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
          Return to Dashboard
        </AdminButton>
      </Link>
    </div>
  );
}
