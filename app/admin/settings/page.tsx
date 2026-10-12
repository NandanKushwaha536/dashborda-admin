'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useSettings, useUpdateSettings, EMPTY_STORE_SETTINGS, type StoreSettings } from '@/lib/hooks/useSettings';
import { useTaxProfileMutations, useTaxProfiles, type TaxProfile, type TaxProfileInput } from '@/lib/hooks/useCatalog';
import { useUrlParams } from '@/lib/hooks/useUrlState';
import { useAuth } from '@/lib/auth/AuthContext';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { GSTIN_PATTERN, INDIAN_STATES, PINCODE_PATTERN } from '@/lib/india';
import { errorMessage, formatINR } from '@/lib/format';
import { PickupLocations } from '@/components/warehouses/PickupLocations';
import { Restricted } from '@/components/shell/Restricted';
import { Card, PageHeader, Section } from '@/components/ui/Layout';
import { Tabs } from '@/components/ui/Navigation';
import { Badge, EmptyState, ErrorState, Notice, Skeleton } from '@/components/ui/Feedback';
import { Button, EditAction } from '@/components/ui/Button';
import { Checkbox, FormError, Input, Select } from '@/components/ui/Form';
import { Modal, useToast } from '@/components/ui/Overlay';

type SettingsTab = 'store' | 'tax' | 'profiles' | 'pickup';
const STATE_OPTIONS = INDIAN_STATES.map((state) => ({ value: state, label: state }));

/** Store details + tax & shipping: both live in the one store-settings record. */
function StoreSettingsForm({ tab, canWrite }: { tab: 'store' | 'tax'; canWrite: boolean }) {
  const toast = useToast();
  const { data, isLoading, error, refetch } = useSettings();
  const save = useUpdateSettings();
  const [values, setValues] = useState<StoreSettings>(EMPTY_STORE_SETTINGS);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  if (isLoading) return <Skeleton className="h-80 w-full" />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  const text = (key: keyof StoreSettings) => ({
    value: String(values[key] ?? ''),
    disabled: !canWrite,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues((current) => ({ ...current, [key]: event.target.value })),
  });
  const number = (key: keyof StoreSettings) => ({
    type: 'number' as const,
    inputMode: 'decimal' as const,
    min: 0,
    value: String(values[key] ?? 0),
    disabled: !canWrite,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [key]: Number(event.target.value) || 0 })),
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const gstin = values.gstNumber.trim().toUpperCase();
    if (gstin && !GSTIN_PATTERN.test(gstin)) return setFormError('GSTIN should be 15 characters, like 27ABCDE1234F1Z5.');
    if (values.postalCode.trim() && !PINCODE_PATTERN.test(values.postalCode.trim())) return setFormError('Pincode should be 6 digits.');
    if (values.taxRate < 0 || values.taxRate > 28) return setFormError('The default GST rate should be between 0 and 28%.');
    try {
      await save.mutateAsync(values);
      toast.success('Settings saved.');
    } catch (err) {
      setFormError(errorMessage(err, 'Settings could not be saved.'));
    }
  };

  const missingInvoice = !values.legalName.trim() || !values.addressLine1.trim() || !values.state.trim() || !values.postalCode.trim();

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <FormError message={formError} />
      {tab === 'store' ? (
        <>
          {missingInvoice ? (
            <Notice tone="warning" title="Invoices need your registered details">
              Add the legal name, address, state and pincode exactly as on your GST registration.
            </Notice>
          ) : null}
          <Section title="Store" description="Shown to customers in emails and on the site.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Store name" {...text('storeName')} />
              <Input label="Support email" type="email" {...text('supportEmail')} />
              <Input label="Support phone" type="tel" inputMode="tel" {...text('supportPhone')} />
            </div>
          </Section>
          <Section title="Business details for invoices" description="Printed on every tax invoice.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Legal business name" {...text('legalName')} />
              <Input label="GSTIN" className="font-mono uppercase" maxLength={15} {...text('gstNumber')} hint="Leave empty if not registered for GST yet." />
              <Input label="Address line 1" containerClassName="sm:col-span-2" {...text('addressLine1')} />
              <Input label="Address line 2" containerClassName="sm:col-span-2" {...text('addressLine2')} />
              <Input label="City" {...text('city')} />
              <Select label="State" {...text('state')} placeholder="Choose state" options={STATE_OPTIONS} />
              <Input label="Pincode" inputMode="numeric" maxLength={6} {...text('postalCode')} />
              <Input label="Invoice number prefix" className="font-mono uppercase" maxLength={10} {...text('invoicePrefix')} hint="E.g. RG → RG-2026-0001" />
            </div>
          </Section>
        </>
      ) : (
        <>
          <Section title="GST" description="Added on top of the price for products that have no tax profile of their own.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input label="Default GST rate (%)" step={0.5} max={28} {...number('taxRate')} />
            </div>
            <p className="mt-3 text-[12.5px] text-slate-500">Confirm the right rate for your products with a CA. Tax profiles (next tab) set the rate and HSN per product.</p>
          </Section>
          <Section title="Shipping charges" description="Applied automatically at checkout to every order.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Standard shipping" prefix="₹" {...number('defaultShippingCharge')} />
              <Input label="Free shipping above" prefix="₹" {...number('freeShippingThreshold')} hint={values.freeShippingThreshold > 0 ? `Orders of ${formatINR(values.freeShippingThreshold)} or more ship free.` : 'Every order ships free.'} />
            </div>
          </Section>
          <Section title="Stock and returns">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input label="Low stock warning at" {...number('lowStockThreshold')} hint="Units left." />
              <Input label="Return window (days)" max={365} {...number('returnWindowDays')} hint="Counted from delivery." />
            </div>
          </Section>
        </>
      )}
      {canWrite ? (
        <div className="flex justify-end">
          <Button type="submit" loading={save.isPending}>
            Save settings
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function TaxProfileDialog({ profile, open, onClose }: { profile: TaxProfile | null; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const { create, update } = useTaxProfileMutations();
  const [values, setValues] = useState({ name: '', hsnCode: '', gstRate: '18', cessRate: '0', inclusive: false, isActive: true });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setError(null);
    setValues({
      name: profile?.name ?? '',
      hsnCode: profile?.hsnCode ?? '',
      gstRate: String(profile?.gstRate ?? 18),
      cessRate: String(profile?.cessRate ?? 0),
      inclusive: profile?.inclusive ?? false,
      isActive: profile?.isActive ?? true,
    });
  }, [open, profile]);
  const saving = create.isPending || update.isPending;
  const save = async () => {
    setError(null);
    const gstRate = Number(values.gstRate);
    if (!values.name.trim()) return setError('Give the profile a name, e.g. "Apparel 5%".');
    if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 28) return setError('GST rate should be between 0 and 28%.');
    const input: TaxProfileInput = { name: values.name, hsnCode: values.hsnCode, gstRate, cessRate: Number(values.cessRate) || 0, inclusive: values.inclusive, isActive: values.isActive };
    try {
      if (profile) await update.mutateAsync({ id: profile._id, input });
      else await create.mutateAsync(input);
      toast.success('Tax profile saved.');
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
      title={profile ? `Edit ${profile.name}` : 'New tax profile'}
      description="Pick it on products that share the same GST rate and HSN code."
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
      <div className="flex flex-col gap-4">
        <FormError message={error} />
        <Input label="Name" required value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} placeholder="Cotton apparel 5%" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="HSN code" inputMode="numeric" className="font-mono" value={values.hsnCode} onChange={(e) => setValues((v) => ({ ...v, hsnCode: e.target.value }))} />
          <Select
            label="GST rate"
            value={values.gstRate}
            onChange={(e) => setValues((v) => ({ ...v, gstRate: e.target.value }))}
            options={['0', '0.25', '3', '5', '12', '18', '28'].map((rate) => ({ value: rate, label: `${rate}%` }))}
          />
          <Input label="Cess (%)" type="number" min={0} value={values.cessRate} onChange={(e) => setValues((v) => ({ ...v, cessRate: e.target.value }))} />
        </div>
        <p className="text-[12.5px] text-slate-600">
          Within your state this splits into CGST {Number(values.gstRate) / 2}% + SGST {Number(values.gstRate) / 2}%; to other states it is IGST {values.gstRate}%.
        </p>
        <Checkbox label="Prices already include GST" description="Leave unticked when GST is added on top of the product price at checkout." checked={values.inclusive} onChange={(e) => setValues((v) => ({ ...v, inclusive: e.target.checked }))} />
        <Checkbox label="Active" checked={values.isActive} onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.checked }))} />
      </div>
    </Modal>
  );
}

function TaxProfiles({ canWrite }: { canWrite: boolean }) {
  const { data = [], isLoading, error, refetch } = useTaxProfiles();
  const [editing, setEditing] = useState<{ profile: TaxProfile | null } | null>(null);
  return (
    <Section
      title="Tax profiles"
      description="A GST rate and HSN code you can attach to products."
      actions={canWrite ? <Button size="sm" icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setEditing({ profile: null })}>New profile</Button> : null}
      bodyClassName="p-0 sm:p-0"
    >
      {isLoading ? (
        <Skeleton className="m-4 h-24" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState title="No tax profiles yet" description="Products use the default GST rate until you add one." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {data.map((profile) => (
            <li key={profile._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900">{profile.name}</span>
                <span className="text-[13px] text-slate-600">
                  {profile.gstRate}% GST{profile.hsnCode ? ` · HSN ${profile.hsnCode}` : ''}
                  {profile.cessRate ? ` · cess ${profile.cessRate}%` : ''} · {profile.inclusive ? 'included in price' : 'added on top'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!profile.isActive ? <Badge>Inactive</Badge> : null}
                {canWrite ? (
                  <EditAction onClick={() => setEditing({ profile })} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <TaxProfileDialog open={editing !== null} profile={editing?.profile ?? null} onClose={() => setEditing(null)} />
    </Section>
  );
}

function SettingsView() {
  const { can } = useAuth();
  const [query, setQuery] = useUrlParams(['tab'] as const);
  // Each tab appears only for roles that can use it (store settings, catalog tax profiles, pickup addresses).
  const tabs: Array<{ value: SettingsTab; label: string }> = [
    ...(can(PERMISSIONS.SETTINGS_READ)
      ? [
          { value: 'store' as const, label: 'Store & invoice' },
          { value: 'tax' as const, label: 'GST & shipping' },
        ]
      : []),
    ...(can(PERMISSIONS.SETTINGS_READ) || can(PERMISSIONS.PRODUCTS_WRITE) ? [{ value: 'profiles' as const, label: 'Tax profiles' }] : []),
    ...(can(PERMISSIONS.SETTINGS_READ) || can(PERMISSIONS.WAREHOUSE_WRITE) ? [{ value: 'pickup' as const, label: 'Pickup locations' }] : []),
  ];
  const requested = (query.tab || 'store') as SettingsTab;
  const tab = tabs.some((item) => item.value === requested) ? requested : tabs[0]?.value ?? 'store';
  return (
    <>
      <PageHeader title="Settings" description="How the store runs: business details, GST, shipping and pickup." />
      <Card className="md:px-2">
        <div className="pt-3 md:pt-0">
          <Tabs<SettingsTab>
            label="Settings section"
            value={tab}
            onChange={(value) => setQuery({ tab: value === 'store' ? null : value })}
            items={tabs}
          />
        </div>
      </Card>
      {tab === 'store' || tab === 'tax' ? (
        <StoreSettingsForm tab={tab} canWrite={can(PERMISSIONS.SETTINGS_WRITE)} />
      ) : tab === 'profiles' ? (
        <TaxProfiles canWrite={can(PERMISSIONS.PRODUCTS_WRITE)} />
      ) : (
        <PickupLocations canWrite={can(PERMISSIONS.WAREHOUSE_WRITE)} />
      )}
    </>
  );
}

export default function SettingsPage() {
  return (
    <Restricted anyOf={[PERMISSIONS.SETTINGS_READ, PERMISSIONS.WAREHOUSE_WRITE, PERMISSIONS.PRODUCTS_WRITE]}>
      <Suspense fallback={null}>
        <SettingsView />
      </Suspense>
    </Restricted>
  );
}
