'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Permission } from '@/lib/auth/permissions';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Layout';
import { EmptyState } from '@/components/ui/Feedback';

/**
 * Shows the page only to roles that can use it. The backend still refuses
 * anything not allowed; this just avoids a page full of errors.
 * `permission`: needed; `anyOf`: at least one needed; `ownerOnly`: the owner only.
 */
export function Restricted({
  permission,
  anyOf,
  ownerOnly = false,
  children,
}: {
  permission?: Permission;
  anyOf?: Permission[];
  ownerOnly?: boolean;
  children: React.ReactNode;
}) {
  const { user, can } = useAuth();
  const allowed = ownerOnly
    ? user?.role === 'SUPER_ADMIN'
    : (!permission || can(permission)) && (!anyOf || anyOf.some((p) => can(p)));

  if (allowed) return <>{children}</>;

  return (
    <Card>
      <EmptyState
        icon={<Lock className="h-6 w-6" aria-hidden="true" />}
        title="You don't have access to this page"
        description="Your role doesn't include this area. Ask the store owner to change your role in Team & roles."
        action={
          <ButtonLink href="/admin" variant="secondary">
            Back to dashboard
          </ButtonLink>
        }
      />
    </Card>
  );
}
