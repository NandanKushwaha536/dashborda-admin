'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { Restricted } from '@/components/shell/Restricted';
import { PageHeader } from '@/components/ui/Layout';
import { PickupLocations } from '@/components/warehouses/PickupLocations';

function WarehousesView() {
  const { can } = useAuth();
  return (
    <>
      <PageHeader title="Warehouses" description="Where your stock is kept and where couriers pick up parcels." />
      <PickupLocations canWrite={can(PERMISSIONS.WAREHOUSE_WRITE)} />
    </>
  );
}

export default function WarehousesPage() {
  return (
    <Restricted permission={PERMISSIONS.WAREHOUSE_READ}>
      <WarehousesView />
    </Restricted>
  );
}
