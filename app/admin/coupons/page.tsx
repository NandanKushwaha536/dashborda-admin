'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useCouponMutations, useCoupons, type Coupon, type CouponInput, type CouponType } from '@/lib/hooks/useCoupons';
import { useAuth } from '@/lib/auth/AuthContext';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { COUPON_STATUS } from '@/lib/status';
import { errorMessage, formatDate, formatINR, formatNumber, toDateInputValue } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { Card, PageHeader } from '@/components/ui/Layout';
import { FilterBar, SearchInput, Tabs } from '@/components/ui/Navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button, DeleteAction, EditAction } from '@/components/ui/Button';
import { FormError, Input, SegmentedControl, Textarea } from '@/components/ui/Form';
import { ConfirmDialog, Modal, useToast } from '@/components/ui/Overlay';

type Filter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

interface Values {
  code: string;
  description: string;
  type: CouponType;
  value: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  perUserLimit: string;
  startDate: string;
  endDate: string;
  active: boolean;
  showOnStore: boolean;
}

function valuesFrom(coupon: Coupon | null): Values {
  const today = new Date();
  const inThirty = new Date(Date.now() + 30 * 86_400_000);
  const asText = (value?: number) => (value ? String(value) : '');
  return {
    code: coupon?.code ?? '',
    description: coupon?.description ?? '',
    type: coupon?.type ?? 'PERCENTAGE',
    value: asText(coupon?.value),
    minOrderAmount: asText(coupon?.minOrderAmount),
    maxDiscountAmount: asText(coupon?.maxDiscountAmount),
    usageLimit: asText(coupon?.usageLimit),
    perUserLimit: asText(coupon?.perUserLimit ?? 1),
    startDate: coupon?.startDate ? toDateInputValue(new Date(coupon.startDate)) : toDateInputValue(today),
    endDate: coupon?.endDate ? toDateInputValue(new Date(coupon.endDate)) : toDateInputValue(inThirty),
    active: coupon ? coupon.status === 'ACTIVE' : true,
    showOnStore: coupon ? coupon.showOnStore : true,
  };
}

function describeDiscount(coupon: Pick<Coupon, 'type' | 'value' | 'maxDiscountAmount' | 'minOrderAmount'>) {
  const main = coupon.type === 'PERCENTAGE' ? `${coupon.value}% off` : `${formatINR(coupon.value)} off`;
  const cap = coupon.type === 'PERCENTAGE' && coupon.maxDiscountAmount ? `, up to ${formatINR(coupon.maxDiscountAmount)}` : '';
  const min = coupon.minOrderAmount ? ` on orders over ${formatINR(coupon.minOrderAmount)}` : '';
  return `${main}${cap}${min}`;
}

function CouponDialog({ coupon, open, onClose }: { coupon: Coupon | null; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const { create, update } = useCouponMutations();
  const [values, setValues] = useState<Values>(() => valuesFrom(coupon));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setValues(valuesFrom(coupon));
      setError(null);
    }
  }, [open, coupon]);

  const field = (key: keyof Values) => ({
    value: values[key] as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((current) => ({ ...current, [key]: event.target.value })),
  });
  const saving = create.isPending || update.isPending;
  const value = Number(values.value);

  const save = async () => {
    setError(null);
    if (!/^[A-Za-z0-9_-]{3,50}$/.test(values.code.trim())) return setError('Code: 3–50 letters or numbers, no spaces.');
    if (!(value > 0)) return setError('Enter the discount amount.');
    if (values.type === 'PERCENTAGE' && value > 100) return setError('A percentage discount cannot be more than 100%.');
    if (!values.startDate || !values.endDate || values.endDate < values.startDate) return setError('The end date must be on or after the start date.');
    const input: CouponInput = {
      code: values.code,
      description: values.description,
      type: values.type,
      value,
      minOrderAmount: Number(values.minOrderAmount) || 0,
      maxDiscountAmount: Number(values.maxDiscountAmount) || undefined,
      usageLimit: Number(values.usageLimit) || undefined,
      perUserLimit: Number(values.perUserLimit) || undefined,
      // Start of the first day to end of the last day, India time.
      startDate: new Date(`${values.startDate}T00:00:00+05:30`).toISOString(),
      endDate: new Date(`${values.endDate}T23:59:59+05:30`).toISOString(),
      status: values.active ? 'ACTIVE' : 'INACTIVE',
      showOnStore: values.showOnStore,
    };
    try {
      if (coupon) await update.mutateAsync({ id: coupon.id, input });
      else await create.mutateAsync(input);
      toast.success(coupon ? 'Coupon saved.' : `Coupon ${input.code.toUpperCase()} created.`);
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'The coupon could not be saved.'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      size="lg"
      title={coupon ? `Edit ${coupon.code}` : 'New coupon'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {coupon ? 'Save coupon' : 'Create coupon'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormError message={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Code" required autoCapitalize="characters" className="font-mono uppercase" {...field('code')} hint="Customers type this at checkout." />
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-slate-700">Discount type</span>
            <SegmentedControl<CouponType>
              label="Discount type"
              value={values.type}
              onChange={(type) => setValues((current) => ({ ...current, type }))}
              options={[
                { value: 'PERCENTAGE', label: 'Percent' },
                { value: 'FIXED', label: 'Flat ₹' },
              ]}
            />
          </div>
          <Input
            label={values.type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (₹)'}
            required
            type="number"
            inputMode="decimal"
            min={0}
            {...field('value')}
          />
          {values.type === 'PERCENTAGE' ? (
            <Input label="Maximum discount" prefix="₹" type="number" min={0} {...field('maxDiscountAmount')} hint="Cap for big orders. Optional." />
          ) : (
            <div className="hidden sm:block" />
          )}
          <Input label="Minimum order" prefix="₹" type="number" min={0} {...field('minOrderAmount')} />
          <Input label="Total uses allowed" type="number" min={1} {...field('usageLimit')} hint="Empty = no limit." />
          <Input label="Uses per customer" type="number" min={1} {...field('perUserLimit')} />
          <div className="hidden sm:block" />
          <Input label="Starts" required type="date" {...field('startDate')} />
          <Input label="Ends" required type="date" {...field('endDate')} />
        </div>
        <Textarea label="Note (optional)" rows={2} maxLength={500} {...field('description')} placeholder="E.g. Diwali campaign" />
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" checked={values.active} onChange={(event) => setValues((current) => ({ ...current, active: event.target.checked }))} className="h-5 w-5 accent-indigo-600" />
          <span className="text-sm font-semibold text-slate-900">Coupon is active</span>
        </label>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" checked={values.showOnStore} onChange={(event) => setValues((current) => ({ ...current, showOnStore: event.target.checked }))} className="h-5 w-5 accent-indigo-600" />
          <span className="text-sm text-slate-900"><span className="font-semibold">Show on the website as an offer.</span> Untick for private codes you give to specific customers.</span>
        </label>
        {value > 0 ? <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-[13px] text-slate-700">Customers get {describeDiscount({ type: values.type, value, maxDiscountAmount: Number(values.maxDiscountAmount) || undefined, minOrderAmount: Number(values.minOrderAmount) || 0 })}.</p> : null}
      </div>
    </Modal>
  );
}

function CouponsView() {
  const toast = useToast();
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.COUPONS_WRITE);
  const { data: coupons = [], isLoading, error, refetch } = useCoupons();
  const { deactivate, remove } = useCouponMutations();
  const [filter, setFilter] = useState<Filter>('ACTIVE');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<{ coupon: Coupon | null } | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { ALL: coupons.length, ACTIVE: 0, INACTIVE: 0, EXPIRED: 0 };
    coupons.forEach((c) => (result[c.status] += 1));
    return result;
  }, [coupons]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return coupons.filter((c) => (filter === 'ALL' || c.status === filter) && (!term || c.code.toLowerCase().includes(term)));
  }, [coupons, filter, search]);

  const usage = (c: Coupon) => `${formatNumber(c.usedCount)}${c.usageLimit ? ` / ${formatNumber(c.usageLimit)}` : ''}`;

  const actions = (c: Coupon, full = false) =>
    canWrite ? (
      <div className={full ? 'flex flex-wrap gap-2' : 'flex justify-end gap-2'}>
        <EditAction onClick={() => setEditing({ coupon: c })} />
        {c.status === 'ACTIVE' ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              try {
                await deactivate.mutateAsync(c.id);
                toast.success(`${c.code} turned off.`);
              } catch (err) {
                toast.error(errorMessage(err));
              }
            }}
          >
            Turn off
          </Button>
        ) : null}
        <DeleteAction onClick={() => setDeleting(c)} />
      </div>
    ) : null;

  const columns: Column<Coupon>[] = [
    {
      key: 'code',
      header: 'Code',
      cell: (c) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono font-semibold text-slate-900">{c.code}</span>
          {c.description ? <span className="text-[12px] text-slate-500">{c.description}</span> : null}
        </div>
      ),
    },
    { key: 'discount', header: 'Discount', cell: (c) => <span className="text-slate-700">{describeDiscount(c)}</span> },
    { key: 'used', header: 'Used', align: 'right', cell: (c) => <span className="tabular">{usage(c)}</span> },
    { key: 'dates', header: 'Valid', cell: (c) => <span className="text-[13px] text-slate-600">{formatDate(c.startDate)} – {formatDate(c.endDate)}</span> },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge map={COUPON_STATUS} value={c.status} /> },
    { key: 'actions', header: 'Actions', align: 'right', cell: (c) => actions(c) },
  ];

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes customers enter at checkout."
        actions={
          canWrite ? (
            <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setEditing({ coupon: null })}>
              New coupon
            </Button>
          ) : null
        }
      />
      <Card className="overflow-hidden">
        <div className="pt-3 md:pt-0">
          <Tabs<Filter>
            label="Coupon status"
            value={filter}
            onChange={setFilter}
            items={[
              { value: 'ACTIVE', label: 'Active', count: counts.ACTIVE },
              { value: 'INACTIVE', label: 'Off', count: counts.INACTIVE },
              { value: 'EXPIRED', label: 'Expired', count: counts.EXPIRED },
              { value: 'ALL', label: 'All', count: counts.ALL },
            ]}
          />
        </div>
        <FilterBar className="border-b border-slate-100">
          <SearchInput className="sm:max-w-sm sm:flex-1" label="Search coupons" placeholder="Coupon code" value={search} onChange={setSearch} />
        </FilterBar>
        <DataTable
          caption="Coupons"
          rows={rows}
          columns={columns}
          getRowId={(c) => c.id}
          loading={isLoading}
          error={error ? errorMessage(error) : null}
          onRetry={() => refetch()}
          empty={{ title: coupons.length === 0 ? 'No coupons yet' : 'No coupons here', description: coupons.length === 0 ? 'Create a code to run a discount.' : undefined }}
          mobileCard={(c) => (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-base font-semibold">{c.code}</span>
                <StatusBadge map={COUPON_STATUS} value={c.status} />
              </div>
              <span className="text-sm text-slate-700">{describeDiscount(c)}</span>
              <span className="text-[12.5px] text-slate-500">
                Used {usage(c)} · until {formatDate(c.endDate)}
              </span>
              {actions(c, true)}
            </div>
          )}
        />
      </Card>
      <CouponDialog open={editing !== null} coupon={editing?.coupon ?? null} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        tone="danger"
        busy={remove.isPending}
        title={`Delete ${deleting?.code ?? 'coupon'}?`}
        confirmLabel="Delete"
        message="Customers can no longer use it. Orders that already used it keep their discount."
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            toast.success(`${deleting.code} deleted.`);
            setDeleting(null);
          } catch (err) {
            toast.error(errorMessage(err));
          }
        }}
      />
    </>
  );
}

export default function CouponsPage() {
  return (
    <Restricted permission={PERMISSIONS.COUPONS_READ}>
      <CouponsView />
    </Restricted>
  );
}
