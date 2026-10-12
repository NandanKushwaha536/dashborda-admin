'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import type { Product, ProductVariant } from '@/lib/api/types';
import { useCreateProduct, useUpdateProduct } from '@/lib/hooks/useProducts';
import {
  useBrands,
  useCategories,
  useCategoryAttributes,
  useReturnPolicies,
  useTaxProfiles,
  type CategoryAttribute,
} from '@/lib/hooks/useCatalog';
import { cn, errorMessage, formatINR } from '@/lib/format';
import { Section } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { Checkbox, FormError, Input, SegmentedControl, Select, Textarea } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Overlay';

type Status = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

interface VariantDraft {
  key: string;
  original: ProductVariant | null;
  variantId: string;
  name: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  colorName: string;
  colorHex: string;
  isActive: boolean;
}

interface Draft {
  name: string;
  shortDescription: string;
  description: string;
  mainCategory: string;
  subCategory: string;
  brand: string;
  price: string;
  salePrice: string;
  compareAtPrice: string;
  taxProfile: string;
  returnPolicy: string;
  sku: string;
  barcode: string;
  stock: string;
  status: Status;
  isFeatured: boolean;
  tags: string;
  attributes: Record<string, unknown>;
  weightGrams: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  manufacturer: string;
  modelNumber: string;
  countryOfOrigin: string;
  warrantyMonths: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  hasVariants: boolean;
  variants: VariantDraft[];
}

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`);
const numText = (value: number | undefined) => (value === undefined || value === null || value === 0 ? '' : String(value));
const toNum = (value: string) => {
  const parsed = Number(value);
  return value.trim() === '' || !Number.isFinite(parsed) ? 0 : parsed;
};

function emptyVariant(index: number): VariantDraft {
  return { key: newId(), original: null, variantId: newId(), name: `Option ${index}`, sku: '', price: '', compareAtPrice: '', stock: '', colorName: '', colorHex: '', isActive: true };
}

function draftFrom(product: Product | null, mainCategory: string, subCategory: string): Draft {
  const seo = (product?.seo ?? {}) as { title?: string; description?: string; keywords?: string[] };
  const variants = product?.variants ?? [];
  return {
    name: product?.name ?? '',
    shortDescription: product?.shortDescription ?? '',
    description: product?.description ?? '',
    mainCategory,
    subCategory,
    brand: product?.brand ?? '',
    price: numText(product?.price),
    salePrice: numText(product?.salePrice),
    compareAtPrice: numText(product?.compareAtPrice),
    taxProfile: product?.taxProfile ?? '',
    returnPolicy: product?.returnPolicy ?? '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    stock: product ? String(product.stock) : '',
    status: product?.status === 'ACTIVE' || product?.status === 'INACTIVE' ? product.status : 'DRAFT',
    isFeatured: Boolean(product?.isFeatured),
    tags: product?.tags.join(', ') ?? '',
    attributes: product?.attributes ?? {},
    weightGrams: numText(product?.weightGrams),
    lengthCm: numText(product?.lengthCm),
    widthCm: numText(product?.widthCm),
    heightCm: numText(product?.heightCm),
    manufacturer: product?.manufacturer ?? '',
    modelNumber: product?.modelNumber ?? '',
    countryOfOrigin: product?.countryOfOrigin ?? 'India',
    warrantyMonths: numText(product?.warrantyMonths),
    seoTitle: typeof seo.title === 'string' ? seo.title : '',
    seoDescription: typeof seo.description === 'string' ? seo.description : '',
    seoKeywords: Array.isArray(seo.keywords) ? seo.keywords.join(', ') : '',
    hasVariants: variants.length > 0,
    variants: variants.map((variant) => ({
      key: newId(),
      original: variant,
      variantId: variant.variantId ?? newId(),
      name: variant.name ?? '',
      sku: variant.sku,
      price: numText(variant.price),
      compareAtPrice: numText(variant.compareAtPrice),
      stock: variant.stock === undefined ? '' : String(variant.stock),
      colorName: variant.colorName ?? '',
      colorHex: variant.colorHex ?? '',
      isActive: variant.isActive !== false,
    })),
  };
}

function AttributeField({ attribute, value, error, onChange }: {
  attribute: CategoryAttribute;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}) {
  const label = attribute.unit ? `${attribute.name} (${attribute.unit})` : attribute.name;
  if (attribute.dataType === 'BOOLEAN') {
    return <Checkbox label={label} checked={value === true} onChange={(event) => onChange(event.target.checked)} />;
  }
  if (attribute.dataType === 'SELECT') {
    return (
      <Select
        label={label}
        required={attribute.required}
        error={error}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Choose"
        options={attribute.options.map((option) => ({ value: option, label: option }))}
      />
    );
  }
  if (attribute.dataType === 'MULTI_SELECT') {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[13px] font-semibold text-slate-700">
          {label}
          {attribute.required ? <span className="text-red-600"> *</span> : null}
        </legend>
        <div className="flex flex-wrap gap-2">
          {attribute.options.map((option) => {
            const on = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={on}
                onClick={() => onChange(on ? selected.filter((item) => item !== option) : [...selected, option])}
                className={cn(
                  'h-10 rounded-full border px-3.5 text-sm',
                  on ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-900' : 'border-slate-300 bg-white text-slate-700'
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
        {error ? <p className="text-[12.5px] font-medium text-red-700">{error}</p> : null}
      </fieldset>
    );
  }
  return (
    <Input
      label={label}
      required={attribute.required}
      error={error}
      type={attribute.dataType === 'NUMBER' ? 'number' : attribute.dataType === 'DATE' ? 'date' : 'text'}
      value={value === undefined || value === null ? '' : String(value)}
      onChange={(event) => onChange(attribute.dataType === 'NUMBER' ? (event.target.value === '' ? '' : Number(event.target.value)) : event.target.value)}
    />
  );
}

export function ProductForm({ product }: { product: Product | null }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(product);
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: taxProfiles = [] } = useTaxProfiles();

  const [draft, setDraft] = useState<Draft>(() => draftFrom(product, '', ''));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [initialised, setInitialised] = useState(!product);

  // Once categories arrive, split the product's category into main + sub.
  useEffect(() => {
    if (initialised || !product || categories.length === 0) return;
    const found = categories.find((category) => category._id === product.category);
    const main = found?.parentId ? found.parentId : product.category;
    const sub = found?.parentId ? found._id : '';
    setDraft(draftFrom(product, main, sub));
    setInitialised(true);
  }, [categories, product, initialised]);

  const mainCategories = useMemo(() => categories.filter((c) => !c.parentId && c.status === 'ACTIVE'), [categories]);
  const subCategories = useMemo(() => categories.filter((c) => c.parentId === draft.mainCategory && c.status === 'ACTIVE'), [categories, draft.mainCategory]);
  const activeBrands = useMemo(() => brands.filter((b) => b.status === 'ACTIVE' || b._id === draft.brand), [brands, draft.brand]);
  const categoryId = draft.subCategory || draft.mainCategory;
  const { data: attributes = [] } = useCategoryAttributes(categoryId);
  const { data: returnPolicies = [] } = useReturnPolicies(categoryId);

  const thumbPreview = useMemo(() => (thumbnail ? URL.createObjectURL(thumbnail) : product?.mainImage || null), [thumbnail, product]);
  const galleryPreviews = useMemo(() => gallery.map((file) => URL.createObjectURL(file)), [gallery]);
  useEffect(() => () => {
    if (thumbnail && thumbPreview) URL.revokeObjectURL(thumbPreview);
  }, [thumbnail, thumbPreview]);
  useEffect(() => () => galleryPreviews.forEach((url) => URL.revokeObjectURL(url)), [galleryPreviews]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };
  const bind = (key: keyof Draft) => ({
    value: draft[key] as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(key, event.target.value as never),
    error: errors[key as string],
  });

  const updateVariant = (key: string, patch: Partial<VariantDraft>) =>
    setDraft((current) => ({ ...current, variants: current.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)) }));

  const pickImages = (files: FileList | null, kind: 'thumbnail' | 'gallery') => {
    if (!files) return;
    const chosen = Array.from(files);
    const bad = chosen.find((file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES);
    if (bad) {
      setErrors((current) => ({ ...current, images: `${bad.name}: use JPG, PNG or WEBP under 5 MB.` }));
      return;
    }
    setErrors((current) => {
      const next = { ...current };
      delete next.images;
      delete next.thumbnail;
      return next;
    });
    if (kind === 'thumbnail') setThumbnail(chosen[0] ?? null);
    else setGallery((current) => [...current, ...chosen].slice(0, MAX_IMAGES));
  };

  const price = toNum(draft.price);
  const sale = toNum(draft.salePrice);
  const mrp = toNum(draft.compareAtPrice);
  const chargeable = Math.max(toNum(draft.weightGrams) / 1000, (toNum(draft.lengthCm) * toNum(draft.widthCm) * toNum(draft.heightCm)) / 5000);

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (draft.name.trim().length < 3) next.name = 'At least 3 characters.';
    if (draft.shortDescription.trim().length < 5) next.shortDescription = 'At least 5 characters.';
    if (draft.description.trim().length < 10) next.description = 'At least 10 characters.';
    if (draft.sku.trim().length < 3) next.sku = 'At least 3 characters.';
    if (!draft.mainCategory) next.mainCategory = 'Choose a category.';
    if (!draft.brand) next.brand = 'Choose a brand.';
    if (draft.price.trim() === '' || price < 0) next.price = 'Enter the price.';
    if (sale < 0 || (sale > 0 && sale >= price)) next.salePrice = 'Must be lower than the price.';
    if (mrp > 0 && mrp < price) next.compareAtPrice = 'MRP cannot be lower than the price.';
    if (draft.stock.trim() === '' || !Number.isInteger(toNum(draft.stock)) || toNum(draft.stock) < 0) next.stock = 'Enter a whole number.';
    if (!isEdit && !thumbnail) next.thumbnail = 'Add the main product photo.';
    attributes.forEach((attribute) => {
      const value = draft.attributes[attribute.key];
      const missing = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
      if (attribute.required && missing) next[`attr.${attribute.key}`] = 'Required for this category.';
    });
    if (draft.hasVariants) {
      const skus = new Set<string>();
      draft.variants.forEach((variant) => {
        const sku = variant.sku.trim().toUpperCase();
        if (!variant.name.trim()) next[`variant.${variant.key}.name`] = 'Name the option.';
        if (!sku) next[`variant.${variant.key}.sku`] = 'Enter a SKU.';
        else if (sku === draft.sku.trim().toUpperCase() || skus.has(sku)) next[`variant.${variant.key}.sku`] = 'Each SKU must be unique.';
        skus.add(sku);
        if (variant.colorHex && !/^#[0-9a-fA-F]{6}$/.test(variant.colorHex)) next[`variant.${variant.key}.colorHex`] = 'Use a colour like #1E1B4B.';
        if (variant.stock !== '' && (!Number.isInteger(toNum(variant.stock)) || toNum(variant.stock) < 0)) next[`variant.${variant.key}.stock`] = 'Whole number.';
      });
    }
    return next;
  };

  const buildBody = (): FormData => {
    const body = new FormData();
    const add = (key: string, value: string | number | boolean) => body.append(key, String(value));
    add('name', draft.name.trim());
    add('shortDescription', draft.shortDescription.trim());
    add('description', draft.description.trim());
    add('sku', draft.sku.trim().toUpperCase());
    add('category', categoryId);
    add('brand', draft.brand);
    add('price', price);
    add('salePrice', sale);
    // MRP is optional. The backend rejects an MRP below the price on create, so an
    // empty MRP is left out there; on edit 0 clears a previously saved MRP.
    if (mrp > 0 || isEdit) add('compareAtPrice', mrp);
    add('stock', toNum(draft.stock));
    add('status', draft.status);
    add('isFeatured', draft.isFeatured);
    add('weightGrams', toNum(draft.weightGrams));
    add('lengthCm', toNum(draft.lengthCm));
    add('widthCm', toNum(draft.widthCm));
    add('heightCm', toNum(draft.heightCm));
    add('warrantyMonths', toNum(draft.warrantyMonths));
    if (draft.barcode.trim()) add('barcode', draft.barcode.trim());
    if (draft.manufacturer.trim()) add('manufacturer', draft.manufacturer.trim());
    if (draft.modelNumber.trim()) add('modelNumber', draft.modelNumber.trim());
    if (draft.countryOfOrigin.trim()) add('countryOfOrigin', draft.countryOfOrigin.trim());
    if (draft.taxProfile) add('taxProfile', draft.taxProfile);
    if (draft.returnPolicy) add('returnPolicy', draft.returnPolicy);
    add('attributes', JSON.stringify(draft.attributes));
    add('tags', JSON.stringify(draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean)));
    add(
      'seo',
      JSON.stringify({
        title: draft.seoTitle.trim(),
        description: draft.seoDescription.trim(),
        keywords: draft.seoKeywords.split(',').map((word) => word.trim()).filter(Boolean),
      })
    );
    const variants = draft.hasVariants
      ? draft.variants.map((variant) => ({
          // Keep fields this form does not edit (weights, images, flags) as they were.
          ...(variant.original ?? {}),
          variantId: variant.variantId,
          name: variant.name.trim(),
          sku: variant.sku.trim().toUpperCase(),
          price: variant.price === '' ? undefined : toNum(variant.price),
          compareAtPrice: variant.compareAtPrice === '' ? undefined : toNum(variant.compareAtPrice),
          stock: variant.stock === '' ? 0 : toNum(variant.stock),
          colorName: variant.colorName.trim() || undefined,
          colorHex: variant.colorHex.trim() || undefined,
          isActive: variant.isActive,
          images: variant.original?.images ?? [],
        }))
      : [];
    add('variants', JSON.stringify(variants));
    if (thumbnail) body.append('thumbnail', thumbnail);
    gallery.forEach((file) => body.append('images', file));
    return body;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError('Some fields need attention. They are marked in red.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    try {
      if (product) {
        await update.mutateAsync({ id: product._id, data: buildBody() });
        toast.success('Product saved.');
        setThumbnail(null);
        setGallery([]);
      } else {
        await create.mutateAsync(buildBody());
        toast.success('Product created.');
        router.push('/admin/products');
      }
    } catch (error) {
      setFormError(errorMessage(error, 'The product could not be saved.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const saving = create.isPending || update.isPending;
  const priceSummary = !price
    ? 'Enter a price to see what the customer pays.'
    : `Customer pays ${formatINR(sale > 0 ? sale : price)}${mrp > (sale || price) ? ` · ${Math.round((1 - (sale || price) / mrp) * 100)}% off MRP` : ''}. GST follows the tax profile or the store default.`;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <FormError message={formError} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Section title="Basic details">
            <div className="flex flex-col gap-4">
              <Input label="Product name" required maxLength={200} {...bind('name')} hint="Shown on the store and the invoice." />
              <Input label="Short description" required maxLength={300} {...bind('shortDescription')} hint="One line for product cards." />
              <Textarea label="Full description" required rows={6} {...bind('description')} placeholder="Material, size, care, what is in the box" />
            </div>
          </Section>

          <Section title="Photos" description="JPG, PNG or WEBP, up to 5 MB each.">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                <label
                  className={cn(
                    'relative col-span-3 flex aspect-[2/1] cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-dashed text-center sm:col-span-2',
                    errors.thumbnail ? 'border-red-400 bg-red-50' : 'border-indigo-300 bg-slate-50 hover:bg-indigo-50'
                  )}
                >
                  {thumbPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local preview or Cloudinary URL
                    <img src={thumbPreview} alt="Main product photo" className="absolute inset-0 h-full w-full object-contain" />
                  ) : (
                    <>
                      <ImagePlus className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                      <span className="text-sm font-semibold text-indigo-900">Main photo</span>
                      <span className="text-[12px] text-slate-600">Tap to choose or take a photo</span>
                    </>
                  )}
                  <input type="file" accept={IMAGE_TYPES.join(',')} className="sr-only" onChange={(event) => pickImages(event.target.files, 'thumbnail')} />
                </label>
                {galleryPreviews.map((url, index) => (
                  <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                    <img src={url} alt={`Extra photo ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove extra photo ${index + 1}`}
                      onClick={() => setGallery((current) => current.filter((_, i) => i !== index))}
                      className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {gallery.length < MAX_IMAGES ? (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-center text-[12.5px] font-medium text-slate-600 hover:bg-slate-50">
                    <Plus className="h-5 w-5" aria-hidden="true" />
                    More photos
                    <input type="file" multiple accept={IMAGE_TYPES.join(',')} className="sr-only" onChange={(event) => pickImages(event.target.files, 'gallery')} />
                  </label>
                ) : null}
              </div>
              {errors.thumbnail || errors.images ? <p className="text-[12.5px] font-medium text-red-700">{errors.thumbnail ?? errors.images}</p> : null}
              {isEdit && product && product.images.length > 0 ? (
                <p className="text-[12.5px] text-slate-500">This product already has {product.images.length} extra photos. New ones are added to them.</p>
              ) : null}
            </div>
          </Section>

          <Section title="Pricing and GST">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input label="Price" prefix="₹" required type="number" inputMode="decimal" min={0} {...bind('price')} />
                <Input label="Sale price" prefix="₹" type="number" inputMode="decimal" min={0} {...bind('salePrice')} hint="Leave empty if no sale." />
                <Input label="MRP" prefix="₹" type="number" inputMode="decimal" min={0} {...bind('compareAtPrice')} hint="Printed maximum price." />
              </div>
              <Select
                label="Tax profile (GST rate and HSN)"
                {...bind('taxProfile')}
                placeholder="Use the store default from Settings"
                options={taxProfiles.filter((t) => t.isActive).map((t) => ({ value: t._id, label: `${t.name} · ${t.gstRate}% GST${t.hsnCode ? ` · HSN ${t.hsnCode}` : ''}` }))}
              />
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-700">{priceSummary}</p>
            </div>
          </Section>

          <Section title="Inventory">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input label="SKU" required autoCapitalize="characters" className="font-mono uppercase" {...bind('sku')} />
                <Input label="Barcode (EAN / UPC)" inputMode="numeric" className="font-mono" {...bind('barcode')} />
                <Input label="Stock" required type="number" inputMode="numeric" min={0} step={1} {...bind('stock')} />
              </div>
              <Checkbox
                boxed
                label="This product has options like size or colour"
                description="Each option gets its own SKU, price and stock."
                checked={draft.hasVariants}
                onChange={(event) => {
                  const on = event.target.checked;
                  setDraft((current) => ({ ...current, hasVariants: on, variants: on && current.variants.length === 0 ? [emptyVariant(1)] : current.variants }));
                }}
              />
              {draft.hasVariants ? (
                <div className="flex flex-col gap-3">
                  {draft.variants.map((variant, index) => {
                    const err = (field: string) => errors[`variant.${variant.key}.${field}`];
                    return (
                      <div key={variant.key} className="rounded-xl border border-slate-200 p-3 sm:p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">Option {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-700 hover:bg-red-50"
                            icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                            onClick={() => setDraft((current) => ({ ...current, variants: current.variants.filter((v) => v.key !== variant.key) }))}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          <Input label="Name" required value={variant.name} error={err('name')} onChange={(e) => updateVariant(variant.key, { name: e.target.value })} placeholder="M / Red" />
                          <Input label="SKU" required value={variant.sku} error={err('sku')} className="font-mono uppercase" onChange={(e) => updateVariant(variant.key, { sku: e.target.value })} />
                          <Input label="Price" prefix="₹" type="number" min={0} value={variant.price} onChange={(e) => updateVariant(variant.key, { price: e.target.value })} hint="Empty = product price" />
                          <Input label="Stock" type="number" min={0} value={variant.stock} error={err('stock')} onChange={(e) => updateVariant(variant.key, { stock: e.target.value })} />
                          <Input label="Colour name" value={variant.colorName} onChange={(e) => updateVariant(variant.key, { colorName: e.target.value })} />
                          <Input label="Colour code" value={variant.colorHex} error={err('colorHex')} placeholder="#1E1B4B" className="font-mono" onChange={(e) => updateVariant(variant.key, { colorHex: e.target.value })} />
                          <Input label="MRP" prefix="₹" type="number" min={0} value={variant.compareAtPrice} onChange={(e) => updateVariant(variant.key, { compareAtPrice: e.target.value })} />
                          <div className="flex items-end">
                            <Checkbox label="Available" checked={variant.isActive} onChange={(e) => updateVariant(variant.key, { isActive: e.target.checked })} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    variant="secondary"
                    icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => setDraft((current) => ({ ...current, variants: [...current.variants, emptyVariant(current.variants.length + 1)] }))}
                  >
                    Add option
                  </Button>
                </div>
              ) : null}
            </div>
          </Section>

          {attributes.length > 0 ? (
            <Section title="Category details" description="Fields this category asks for.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {attributes.map((attribute) => (
                  <AttributeField
                    key={attribute._id}
                    attribute={attribute}
                    value={draft.attributes[attribute.key]}
                    error={errors[`attr.${attribute.key}`]}
                    onChange={(value) => set('attributes', { ...draft.attributes, [attribute.key]: value })}
                  />
                ))}
              </div>
            </Section>
          ) : null}

          <Section title="Shipping size" description="Packed weight and box size. Couriers bill on the higher of actual and volumetric weight.">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Input label="Weight (g)" type="number" inputMode="numeric" min={0} {...bind('weightGrams')} />
                <Input label="Length (cm)" type="number" inputMode="decimal" min={0} {...bind('lengthCm')} />
                <Input label="Width (cm)" type="number" inputMode="decimal" min={0} {...bind('widthCm')} />
                <Input label="Height (cm)" type="number" inputMode="decimal" min={0} {...bind('heightCm')} />
              </div>
              {chargeable > 0 ? <p className="text-[13px] text-slate-700">Chargeable weight: {chargeable.toFixed(2)} kg</p> : null}
            </div>
          </Section>

          <Section title="Search engine listing">
            <div className="flex flex-col gap-4">
              <Input label="Page title" maxLength={70} {...bind('seoTitle')} hint="Defaults to the product name." />
              <Textarea label="Meta description" rows={3} maxLength={160} {...bind('seoDescription')} hint="Defaults to the short description." />
              <Input label="Keywords" {...bind('seoKeywords')} hint="Comma separated." />
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-5">
          <Section title="Status">
            <div className="flex flex-col gap-2">
              <SegmentedControl<Status>
                label="Product status"
                value={draft.status}
                onChange={(value) => set('status', value)}
                options={[
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ]}
              />
              <p className="text-[12.5px] text-slate-600">
                {draft.status === 'ACTIVE' ? 'Visible and buyable on the store.' : draft.status === 'DRAFT' ? 'Only staff can see a draft.' : 'Hidden from the store; data is kept.'}
              </p>
            </div>
          </Section>

          <Section title="Organisation">
            <div className="flex flex-col gap-4">
              <Select
                label="Category"
                required
                value={draft.mainCategory}
                error={errors.mainCategory}
                onChange={(event) => setDraft((current) => ({ ...current, mainCategory: event.target.value, subCategory: '', attributes: {} }))}
                placeholder="Choose a category"
                options={mainCategories.map((c) => ({ value: c._id, label: c.name }))}
              />
              {subCategories.length > 0 ? (
                <Select
                  label="Sub-category"
                  value={draft.subCategory}
                  onChange={(event) => setDraft((current) => ({ ...current, subCategory: event.target.value, attributes: {} }))}
                  placeholder="None"
                  options={subCategories.map((c) => ({ value: c._id, label: c.name }))}
                />
              ) : null}
              <Select label="Brand" required {...bind('brand')} placeholder="Choose a brand" options={activeBrands.map((b) => ({ value: b._id, label: b.name }))} />
              <Input label="Tags" {...bind('tags')} hint="Comma separated, e.g. cotton, summer" />
              <Checkbox label="Feature on the homepage" checked={draft.isFeatured} onChange={(event) => set('isFeatured', event.target.checked)} />
            </div>
          </Section>

          <Section title="Product details">
            <div className="flex flex-col gap-4">
              <Input label="Manufacturer" {...bind('manufacturer')} />
              <Input label="Model number" {...bind('modelNumber')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Country of origin" {...bind('countryOfOrigin')} />
                <Input label="Warranty (months)" type="number" min={0} max={240} {...bind('warrantyMonths')} />
              </div>
              <Select
                label="Return rule"
                {...bind('returnPolicy')}
                placeholder="Store return window (Settings)"
                options={returnPolicies.map((p) => ({ value: p._id, label: p.isReturnable ? `${p.name} · ${p.returnWindowDays} days` : `${p.name} · not returnable` }))}
              />
            </div>
          </Section>
        </div>
      </div>

      <div className="pb-safe sticky bottom-16 z-10 -mx-4 flex gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:justify-end md:border-0 md:bg-transparent md:p-0">
        <Button variant="secondary" className="flex-1 md:flex-none" onClick={() => router.push('/admin/products')} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" className="flex-[1.4] md:flex-none" loading={saving}>
          {isEdit ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </form>
  );
}
