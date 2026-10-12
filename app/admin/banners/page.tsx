'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ImageIcon, Plus, Upload } from 'lucide-react';
import { useBannerMutations, useBanners, type Banner, type BannerInput } from '@/lib/hooks/useBanners';
import { useAuth } from '@/lib/auth/AuthContext';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { errorMessage } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { PageHeader, Section } from '@/components/ui/Layout';
import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Button, DeleteAction, EditAction } from '@/components/ui/Button';
import { Checkbox, FormError, Input, Textarea } from '@/components/ui/Form';
import { ConfirmDialog, Modal, useToast } from '@/components/ui/Overlay';

const emptyBanner = (): BannerInput => ({ title: '', subtitle: '', tag: '', image: '', ctaText: 'Shop Now', ctaLink: '/products', live: true });

function BannerDialog({ banner, open, onClose }: { banner: Banner | null; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const { create, update, uploadImage } = useBannerMutations();
  const [values, setValues] = useState<BannerInput>(emptyBanner());
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    setError(null);
    setValues(banner ? { ...banner } : emptyBanner());
  }, [open, banner]);
  const field = (key: 'title' | 'subtitle' | 'tag' | 'image' | 'ctaText' | 'ctaLink') => ({
    value: values[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [key]: event.target.value })),
  });
  const saving = create.isPending || update.isPending;
  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError('Picture should be 5 MB or smaller.');
    setError(null);
    try {
      const url = await uploadImage.mutateAsync(file);
      setValues((v) => ({ ...v, image: url }));
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  const save = async () => {
    setError(null);
    if (values.title.trim().length < 2) return setError('Enter a heading for the banner.');
    if (!values.image.trim()) return setError('Upload a picture for the banner.');
    const link = values.ctaLink.trim();
    if (link && (!link.startsWith('/') || link.startsWith('//'))) return setError('Button link should be a page of your website, starting with / (for example /products or /category/phones).');
    try {
      if (banner) await update.mutateAsync({ id: banner.id, input: values });
      else await create.mutateAsync(values);
      toast.success('Banner saved.');
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving || uploadImage.isPending}
      size="lg"
      title={banner ? 'Edit banner' : 'New banner'}
      description="Shown at the top of the website home page."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={uploadImage.isPending}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormError message={error} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-[13px] font-semibold text-slate-700">Picture</span>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-24 w-40 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {values.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL
                <img src={values.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-slate-400" aria-hidden="true" />
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
            <Button variant="secondary" size="sm" icon={<Upload className="h-4 w-4" aria-hidden="true" />} loading={uploadImage.isPending} onClick={() => fileRef.current?.click()}>
              {values.image ? 'Change picture' : 'Upload picture'}
            </Button>
          </div>
          <p className="text-[12.5px] text-slate-500">JPG, PNG or WEBP up to 5 MB. A square or 4:3 picture looks best.</p>
        </div>
        <Input label="Heading" required containerClassName="sm:col-span-2" maxLength={80} {...field('title')} placeholder="Diwali Sale: up to 40% off" />
        <Textarea label="Short text" containerClassName="sm:col-span-2" rows={2} maxLength={200} {...field('subtitle')} placeholder="On phones, audio and more. Free delivery above ₹499." />
        <Input label="Small label" maxLength={30} {...field('tag')} placeholder="Limited offer" />
        <Input label="Button text" maxLength={24} {...field('ctaText')} placeholder="Shop Now" />
        <Input label="Button link" containerClassName="sm:col-span-2" {...field('ctaLink')} placeholder="/products" hint="A page of your website, for example /products or /category/phones." />
        <div className="sm:col-span-2">
          <Checkbox label="Show on website" checked={values.live} onChange={(e) => setValues((v) => ({ ...v, live: e.target.checked }))} />
        </div>
      </div>
    </Modal>
  );
}

function BannersView() {
  const toast = useToast();
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.MARKETING_WRITE);
  const { data: banners = [], isLoading, error, refetch } = useBanners();
  const { remove } = useBannerMutations();
  const [editing, setEditing] = useState<{ banner: Banner | null } | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  return (
    <>
      <PageHeader title="Home banners" description="The big slides at the top of the website home page. With no banner, your newest products are shown there." />
      <Section
        title="Banners"
        description="Up to 5 banners that are switched on are shown, oldest first."
        actions={canWrite ? <Button size="sm" icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setEditing({ banner: null })}>New banner</Button> : null}
        bodyClassName="p-0 sm:p-0"
      >
        {isLoading ? (
          <Skeleton className="m-4 h-24" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : banners.length === 0 ? (
          <EmptyState title="No banner yet" description="Add one to show your offer at the top of the home page." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {banners.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {b.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL
                      <img src={b.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-slate-900">{b.title}</span>
                    {b.subtitle ? <span className="truncate text-[13px] text-slate-600">{b.subtitle}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={b.live ? 'green' : 'neutral'}>{b.live ? 'On website' : 'Hidden'}</Badge>
                  {canWrite ? (
                    <>
                      <EditAction onClick={() => setEditing({ banner: b })} />
                      <DeleteAction onClick={() => setDeleting(b)} />
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <BannerDialog open={editing !== null} banner={editing?.banner ?? null} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        tone="danger"
        busy={remove.isPending}
        title="Delete this banner?"
        confirmLabel="Delete"
        message="It will be removed from the home page. To hide it for now, edit it and untick Show on website instead."
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            toast.success('Banner deleted.');
            setDeleting(null);
          } catch (err) {
            toast.error(errorMessage(err));
          }
        }}
      />
    </>
  );
}

export default function BannersPage() {
  return (
    <Restricted permission={PERMISSIONS.MARKETING_READ}>
      <BannersView />
    </Restricted>
  );
}
