'use client';

import React, { useEffect, useState } from 'react';
import type { Brand, Category } from '@/lib/api/types';
import { useBrandMutations, useCategoryMutations } from '@/lib/hooks/useCatalog';
import { errorMessage } from '@/lib/format';
import { Modal, useToast } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { FormError, Input, SegmentedControl, Select, Textarea } from '@/components/ui/Form';

type Kind = 'category' | 'brand';

interface Values {
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: string;
  parentCategory: string;
  website: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

function initialValues(entity: Category | Brand | null, defaultParent: string): Values {
  const category = entity as Category | null;
  const brand = entity as Brand | null;
  return {
    name: entity?.name ?? '',
    description: entity?.description ?? '',
    status: entity?.status ?? 'ACTIVE',
    sortOrder: entity?.sortOrder ? String(entity.sortOrder) : '',
    parentCategory: category?.parentId ?? defaultParent,
    website: brand?.website ?? '',
    seoTitle: entity?.seo?.title ?? '',
    seoDescription: entity?.seo?.description ?? '',
    seoKeywords: entity?.seo?.keywords?.join(', ') ?? '',
  };
}

/**
 * Add or edit a category or a brand. Both are saved as multipart form data
 * with an optional picture (category image / brand logo).
 */
export function CatalogEntityDialog({
  kind,
  open,
  entity,
  parents = [],
  defaultParent = '',
  onClose,
}: {
  kind: Kind;
  open: boolean;
  entity: Category | Brand | null;
  parents?: Category[];
  defaultParent?: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const categoryMutations = useCategoryMutations();
  const brandMutations = useBrandMutations();
  const mutations = kind === 'category' ? categoryMutations : brandMutations;
  const [values, setValues] = useState<Values>(() => initialValues(entity, defaultParent));
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(initialValues(entity, defaultParent));
      setImage(null);
      setError(null);
    }
  }, [open, entity, defaultParent]);

  const field = (key: keyof Values) => ({
    value: values[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.value })),
  });

  const noun = kind === 'category' ? (values.parentCategory ? 'sub-category' : 'category') : 'brand';
  const saving = mutations.create.isPending || mutations.update.isPending;

  const save = async () => {
    setError(null);
    if (values.name.trim().length < 2) {
      setError('Enter a name of at least 2 characters.');
      return;
    }
    if (kind === 'brand' && values.website.trim() && !/^https?:\/\//.test(values.website.trim())) {
      setError('The website must start with https://');
      return;
    }
    const body = new FormData();
    body.append('name', values.name.trim());
    if (values.description.trim()) body.append('description', values.description.trim());
    body.append('status', values.status);
    body.append('sortOrder', String(Number(values.sortOrder) || 0));
    if (kind === 'category' && values.parentCategory) body.append('parentCategory', values.parentCategory);
    if (kind === 'brand' && values.website.trim()) body.append('website', values.website.trim());
    body.append(
      'seo',
      JSON.stringify({
        title: values.seoTitle.trim(),
        description: values.seoDescription.trim(),
        keywords: values.seoKeywords.split(',').map((word) => word.trim()).filter(Boolean),
      })
    );
    if (image) body.append(kind === 'category' ? 'image' : 'logo', image);
    try {
      if (entity) await mutations.update.mutateAsync({ id: entity._id, body });
      else await mutations.create.mutateAsync(body);
      toast.success(entity ? `${values.name.trim()} saved.` : `${values.name.trim()} added.`);
      onClose();
    } catch (err) {
      setError(errorMessage(err, `The ${noun} could not be saved.`));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      size="lg"
      title={entity ? `Edit ${noun}` : `Add ${noun}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {entity ? 'Save changes' : `Add ${noun}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormError message={error} />
        <Input label="Name" required maxLength={100} {...field('name')} />
        {kind === 'category' ? (
          <Select
            label="Parent category"
            {...field('parentCategory')}
            placeholder="None (main category)"
            options={parents.filter((p) => p._id !== entity?._id).map((p) => ({ value: p._id, label: p.name }))}
            hint="Choose a parent to make this a sub-category."
          />
        ) : (
          <Input label="Website" type="url" placeholder="https://" {...field('website')} />
        )}
        <Textarea label="Description" rows={3} maxLength={1000} {...field('description')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-slate-700">Status</span>
            <SegmentedControl<'ACTIVE' | 'INACTIVE'>
              label="Status"
              value={values.status}
              onChange={(status) => setValues((current) => ({ ...current, status }))}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Hidden' },
              ]}
            />
          </div>
          <Input label="Display order" type="number" min={0} {...field('sortOrder')} hint="Lower numbers show first." />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-slate-700" htmlFor={`${kind}-image`}>
            {kind === 'category' ? 'Category image' : 'Logo'}
          </label>
          <input
            id={`${kind}-image`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-700 file:mr-3 file:h-10 file:cursor-pointer file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:font-semibold file:text-indigo-800"
          />
        </div>
        <details className="rounded-xl border border-slate-200 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800">Search engine listing</summary>
          <div className="mt-3 flex flex-col gap-3">
            <Input label="Page title" maxLength={70} {...field('seoTitle')} />
            <Textarea label="Meta description" rows={2} maxLength={160} {...field('seoDescription')} />
            <Input label="Keywords" {...field('seoKeywords')} hint="Comma separated." />
          </div>
        </details>
      </div>
    </Modal>
  );
}
