'use client';

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useWarehouseMutations, useWarehouses, type WarehouseInput } from '@/lib/hooks/useWarehouses';
import { INDIAN_STATES, PINCODE_PATTERN } from '@/lib/india';
import { errorMessage } from '@/lib/format';
import type { Warehouse } from '@/lib/api/types';
import { Section } from '@/components/ui/Layout';
import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Button, DeleteAction, EditAction } from '@/components/ui/Button';
import { Checkbox, FormError, Input, Select } from '@/components/ui/Form';
import { ConfirmDialog, Modal, useToast } from '@/components/ui/Overlay';

const STATE_OPTIONS = INDIAN_STATES.map((state) => ({ value: state, label: state }));

const emptyWarehouse = (): WarehouseInput => ({ name: '', code: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', status: 'ACTIVE' });

function PickupDialog({ warehouse, open, onClose }: { warehouse: Warehouse | null; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const { create, update } = useWarehouseMutations();
  const [values, setValues] = useState<WarehouseInput>(emptyWarehouse());
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setError(null);
    setValues(warehouse ? { ...warehouse, addressLine2: warehouse.addressLine2 ?? '' } : emptyWarehouse());
  }, [open, warehouse]);
  const field = (key: keyof WarehouseInput) => ({
    value: String(values[key] ?? ''),
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues((v) => ({ ...v, [key]: event.target.value })),
  });
  const saving = create.isPending || update.isPending;
  const save = async () => {
    setError(null);
    if (values.name.trim().length < 2 || values.code.trim().length < 2) return setError('Enter a name and a short code (e.g. MAIN).');
    if (values.addressLine1.trim().length < 2 || values.city.trim().length < 2 || !values.state) return setError('Enter the full pickup address.');
    if (!PINCODE_PATTERN.test(values.pincode.trim())) return setError('Pincode should be 6 digits.');
    try {
      if (warehouse) await update.mutateAsync({ id: warehouse.id, input: values });
      else await create.mutateAsync(values);
      toast.success('Pickup location saved.');
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      size="lg"
      title={warehouse ? `Edit ${warehouse.name}` : 'New pickup location'}
      description="Where couriers collect parcels from."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormError message={error} />
        </div>
        <Input label="Name" required {...field('name')} placeholder="Main warehouse" />
        <Input label="Short code" required className="font-mono uppercase" maxLength={30} {...field('code')} placeholder="MAIN" />
        <Input label="Address line 1" required containerClassName="sm:col-span-2" {...field('addressLine1')} />
        <Input label="Address line 2" containerClassName="sm:col-span-2" {...field('addressLine2')} />
        <Input label="City" required {...field('city')} />
        <Select label="State" required {...field('state')} placeholder="Choose state" options={STATE_OPTIONS} />
        <Input label="Pincode" required inputMode="numeric" maxLength={6} {...field('pincode')} />
        <div className="flex items-end">
          <Checkbox label="In use" checked={values.status === 'ACTIVE'} onChange={(e) => setValues((v) => ({ ...v, status: e.target.checked ? 'ACTIVE' : 'INACTIVE' }))} />
        </div>
      </div>
    </Modal>
  );
}

/** Warehouses / pickup locations: list, add, edit and delete. Used on Settings and on the Warehouses page. */
export function PickupLocations({ canWrite }: { canWrite: boolean }) {
  const toast = useToast();
  const { data, isLoading, error, refetch } = useWarehouses();
  const { remove } = useWarehouseMutations();
  const [editing, setEditing] = useState<{ warehouse: Warehouse | null } | null>(null);
  const [deleting, setDeleting] = useState<Warehouse | null>(null);
  const list = data?.warehouses ?? [];
  return (
    <Section
      title="Pickup locations"
      description="Needed to ship orders. Usually your shop or warehouse address."
      actions={canWrite ? <Button size="sm" icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setEditing({ warehouse: null })}>New location</Button> : null}
      bodyClassName="p-0 sm:p-0"
    >
      {isLoading ? (
        <Skeleton className="m-4 h-24" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : list.length === 0 ? (
        <EmptyState title="No pickup location yet" description="Add one before shipping your first order." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {list.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900">
                  {w.name} <span className="font-mono text-[12px] font-medium text-slate-500">{w.code}</span>
                </span>
                <span className="text-[13px] text-slate-600">
                  {[w.addressLine1, w.city, w.state, w.pincode].filter(Boolean).join(', ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={w.status === 'ACTIVE' ? 'green' : 'neutral'}>{w.status === 'ACTIVE' ? 'In use' : 'Not in use'}</Badge>
                {canWrite ? (
                  <>
                    <EditAction onClick={() => setEditing({ warehouse: w })} />
                    <DeleteAction onClick={() => setDeleting(w)} />
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <PickupDialog open={editing !== null} warehouse={editing?.warehouse ?? null} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        tone="danger"
        busy={remove.isPending}
        title={`Delete ${deleting?.name ?? 'warehouse'}?`}
        confirmLabel="Delete"
        message="This removes the warehouse for good. It is only allowed when it holds no stock and no open orders depend on it. To stop using it for now, edit it and untick In use instead."
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            toast.success('Warehouse deleted.');
            setDeleting(null);
          } catch (err) {
            toast.error(errorMessage(err));
          }
        }}
      />
    </Section>
  );
}
