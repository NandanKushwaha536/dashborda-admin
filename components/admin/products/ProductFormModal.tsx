'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Layers,
  Package2,
  Plus,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { Product, ProductVariant } from '@/lib/api/types';
import { AdminModal } from '../ui/AdminModal';
import { AdminInput } from '../ui/AdminInput';
import { AdminSelect } from '../ui/AdminSelect';
import { AdminSearchableSelect, SearchableOption } from '../ui/AdminSearchableSelect';
import { AdminButton } from '../ui/AdminButton';
import { useCreateProduct, useUpdateProduct } from '@/lib/hooks/useProducts';
import {
  CategoryAttribute,
  useBrands,
  useCategories,
  useCategoryAttributes,
  useReturnPolicies,
  useTaxProfiles,
} from '@/lib/hooks/useCatalog';

interface VariantFormData {
  variantId: string;
  name: string;
  sku: string;
  colorName: string;
  colorHex: string;
  price: number;
  compareAtPrice: number;
  barcode: string;
  stock: number;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  taxProfile: string;
  returnPolicy: string;
  isFragile: boolean;
  requiresColdChain: boolean;
  hazmatClass: string;
  serialTrackingRequired: boolean;
  imeiRequired: boolean;
  dispatchWeightTolerancePercent: number;
  isActive: boolean;
  attributes: Record<string, unknown>;
  existingImages: { url: string; publicId: string }[];
  galleryIndexes: number[];
}

type ProductFormData = {
  name: string;
  sku: string;
  mainCategory: string;
  subCategory: string;
  brand: string;
  productType: NonNullable<Product['productType']>;
  price: number;
  salePrice: number;
  compareAtPrice: number;
  barcode: string;
  stock: number;
  status: Product['status'];
  description: string;
  shortDescription: string;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  manufacturer: string;
  modelNumber: string;
  countryOfOrigin: string;
  warrantyMonths: number;
  taxProfile: string;
  returnPolicy: string;
  isFragile: boolean;
  requiresColdChain: boolean;
  hazmatClass: string;
  serialTrackingRequired: boolean;
  imeiRequired: boolean;
  dispatchWeightTolerancePercent: number;
  isFeatured: boolean;
  tags: string;
  attributes: Record<string, unknown>;
  variants: VariantFormData[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

const makeVariantId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const emptyVariant = (index = 1): VariantFormData => ({
  variantId: makeVariantId(),
  name: `Variant ${index}`,
  sku: '',
  colorName: '',
  colorHex: '',
  price: 0,
  compareAtPrice: 0,
  barcode: '',
  stock: 0,
  weightGrams: 0,
  lengthCm: 0,
  widthCm: 0,
  heightCm: 0,
  taxProfile: '',
  returnPolicy: '',
  isFragile: false,
  requiresColdChain: false,
  hazmatClass: '',
  serialTrackingRequired: false,
  imeiRequired: false,
  dispatchWeightTolerancePercent: 10,
  isActive: true,
  attributes: {},
  existingImages: [],
  galleryIndexes: [],
});

const emptyForm = (mainCategory = '', subCategory = '', brand = ''): ProductFormData => ({
  name: '',
  sku: '',
  mainCategory,
  subCategory,
  brand,
  productType: 'PHYSICAL',
  price: 0,
  salePrice: 0,
  compareAtPrice: 0,
  barcode: '',
  stock: 0,
  status: 'DRAFT',
  description: '',
  shortDescription: '',
  weightGrams: 0,
  lengthCm: 0,
  widthCm: 0,
  heightCm: 0,
  manufacturer: '',
  modelNumber: '',
  countryOfOrigin: '',
  warrantyMonths: 0,
  taxProfile: '',
  returnPolicy: '',
  isFragile: false,
  requiresColdChain: false,
  hazmatClass: '',
  serialTrackingRequired: false,
  imeiRequired: false,
  dispatchWeightTolerancePercent: 10,
  isFeatured: false,
  tags: '',
  attributes: {},
  variants: [],
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
});

function getEntityId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const obj = value as { _id?: unknown; id?: unknown };
    return String(obj._id ?? obj.id ?? '');
  }
  return '';
}

function getSeo(product: Product): Record<string, unknown> {
  const raw = product as Product & Record<string, unknown>;
  return raw.seo && typeof raw.seo === 'object' ? (raw.seo as Record<string, unknown>) : {};
}

function getVariantFormData(variant: ProductVariant, index: number): VariantFormData {
  return {
    variantId: variant.variantId || makeVariantId(),
    name: variant.name || `Variant ${index + 1}`,
    sku: variant.sku || '',
    colorName: variant.colorName || '',
    colorHex: variant.colorHex || '',
    price: Number(variant.price ?? 0),
    compareAtPrice: Number(variant.compareAtPrice ?? 0),
    barcode: variant.barcode || '',
    stock: Number(variant.stock ?? 0),
    weightGrams: Number(variant.weightGrams ?? 0),
    lengthCm: Number(variant.lengthCm ?? 0),
    widthCm: Number(variant.widthCm ?? 0),
    heightCm: Number(variant.heightCm ?? 0),
    taxProfile: variant.taxProfile || '',
    returnPolicy: variant.returnPolicy || '',
    isFragile: Boolean(variant.isFragile),
    requiresColdChain: Boolean(variant.requiresColdChain),
    hazmatClass: variant.hazmatClass || '',
    serialTrackingRequired: Boolean(variant.serialTrackingRequired),
    imeiRequired: Boolean(variant.imeiRequired),
    dispatchWeightTolerancePercent: Number(variant.dispatchWeightTolerancePercent ?? 10),
    isActive: variant.isActive !== false,
    attributes: variant.attributes && typeof variant.attributes === 'object' ? variant.attributes : {},
    existingImages: Array.isArray(variant.images)
      ? variant.images
          .filter((image) => Boolean(image?.url))
          .map((image) => ({ url: image.url, publicId: image.publicId || '' }))
      : [],
    galleryIndexes: [],
  };
}

export function ProductFormModal({
  isOpen,
  onClose,
  product = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}) {
  const isEditing = Boolean(product);
  const [activeTab, setActiveTab] = useState<'basic' | 'content_media' | 'variants' | 'logistics' | 'seo'>('basic');
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  // Master Data
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: taxProfiles = [] } = useTaxProfiles();

  // Form State
  const [formData, setFormData] = useState<ProductFormData>(emptyForm());
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvancedShipping, setShowAdvancedShipping] = useState(false);

  // Active master data filters
  const activeBrands = useMemo(
    () => brands.filter((b) => b.status === 'ACTIVE').sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [brands]
  );

  const mainCategories = useMemo(
    () => categories.filter((c) => !c.parentId && c.status === 'ACTIVE').sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );

  const subCategories = useMemo(() => {
    if (!formData.mainCategory) return [];
    return categories
      .filter((c) => c.parentId === formData.mainCategory && c.status === 'ACTIVE')
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [categories, formData.mainCategory]);

  const activeTaxProfiles = useMemo(
    () => taxProfiles.filter((tp) => tp.isActive !== false),
    [taxProfiles]
  );

  // Return policies depend on the effective category
  const effectiveCategoryId = formData.subCategory || formData.mainCategory;
  const { data: returnPolicies = [] } = useReturnPolicies(effectiveCategoryId);
  const activeReturnPolicies = useMemo(
    () => returnPolicies.filter((rp) => rp.isActive !== false),
    [returnPolicies]
  );

  // Category Attributes depend on the effective category
  const { data: categoryAttributes = [], isLoading: attributesLoading } = useCategoryAttributes(effectiveCategoryId);
  const activeAttributes = useMemo(
    () => categoryAttributes.filter((item) => item.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [categoryAttributes]
  );

  // Initialize/reset form
  useEffect(() => {
    if (!isOpen) return;

    if (product) {
      const raw = product as Product & Record<string, unknown>;
      const rawCatId = getEntityId(raw.category) || product.category || '';
      const rawBrandId = getEntityId(raw.brand) || product.brand || '';
      const seo = getSeo(product);

      // Determine main and subcategory
      let resolvedMainCat = '';
      let resolvedSubCat = '';
      const foundCat = categories.find((c) => c._id === rawCatId);
      if (foundCat) {
        if (foundCat.parentId) {
          resolvedMainCat = foundCat.parentId;
          resolvedSubCat = foundCat._id;
        } else {
          resolvedMainCat = foundCat._id;
          resolvedSubCat = '';
        }
      } else {
        resolvedMainCat = rawCatId;
      }

      setFormData({
        ...emptyForm(resolvedMainCat, resolvedSubCat, rawBrandId),
        name: product.name || '',
        sku: product.sku || '',
        mainCategory: resolvedMainCat,
        subCategory: resolvedSubCat,
        brand: rawBrandId,
        productType: (product.productType || 'PHYSICAL') as NonNullable<Product['productType']>,
        price: Number(product.price || 0),
        salePrice: Number(product.salePrice || 0),
        compareAtPrice: Number(product.compareAtPrice || 0),
        barcode: product.barcode || '',
        stock: Number(product.stock || 0),
        status: product.status,
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        weightGrams: Number(product.weightGrams || 0),
        lengthCm: Number(product.lengthCm || 0),
        widthCm: Number(product.widthCm || 0),
        heightCm: Number(product.heightCm || 0),
        manufacturer: product.manufacturer || '',
        modelNumber: product.modelNumber || '',
        countryOfOrigin: product.countryOfOrigin || '',
        warrantyMonths: Number(product.warrantyMonths || 0),
        taxProfile: product.taxProfile || '',
        returnPolicy: product.returnPolicy || '',
        isFragile: Boolean(product.isFragile),
        requiresColdChain: Boolean(product.requiresColdChain),
        hazmatClass: product.hazmatClass || '',
        serialTrackingRequired: Boolean(product.serialTrackingRequired),
        imeiRequired: Boolean(product.imeiRequired),
        dispatchWeightTolerancePercent: Number(product.dispatchWeightTolerancePercent ?? 10),
        isFeatured: Boolean(product.isFeatured ?? product.featured),
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
        attributes: product.attributes && typeof product.attributes === 'object' ? product.attributes : {},
        variants: Array.isArray(product.variants) ? product.variants.map(getVariantFormData) : [],
        seoTitle: typeof seo.title === 'string' ? seo.title : product.seoTitle || '',
        seoDescription: typeof seo.description === 'string' ? seo.description : product.seoDescription || '',
        seoKeywords: Array.isArray(seo.keywords) ? seo.keywords.join(', ') : product.seoKeywords || '',
      });

      // Product thumbnail preview if available
      const rawThumbnail = (product as Product & { thumbnail?: { url?: string } | string }).thumbnail;
      if (typeof rawThumbnail === 'string') {
        setThumbnailPreview(rawThumbnail);
      } else if (rawThumbnail && typeof rawThumbnail === 'object' && rawThumbnail.url) {
        setThumbnailPreview(rawThumbnail.url);
      } else {
        setThumbnailPreview(null);
      }
      setThumbnailFile(null);
      setGalleryFiles([]);
      setGalleryPreviews([]);
    } else {
      setFormData(emptyForm());
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setGalleryFiles([]);
      setGalleryPreviews([]);
    }
    setActiveTab('basic');
    setErrors({});
  }, [product, isOpen, categories]);

  // Handle Thumbnail selection with preview
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.thumbnail;
        return next;
      });
    }
  };

  // Handle Gallery images selection with previews
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const newFiles = [...galleryFiles, ...selected].slice(0, 10);
    setGalleryFiles(newFiles);
    setGalleryPreviews(newFiles.map((file) => URL.createObjectURL(file)));
  };

  const removeGalleryFile = (index: number) => {
    const updatedFiles = galleryFiles.filter((_, i) => i !== index);
    setGalleryFiles(updatedFiles);
    setGalleryPreviews(updatedFiles.map((file) => URL.createObjectURL(file)));
  };

  const updateField = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Category and Subcategory selection handlers
  const handleMainCategoryChange = (mainCatId: string) => {
    setFormData((current) => ({
      ...current,
      mainCategory: mainCatId,
      subCategory: '',
      attributes: {}, // Clear attributes when category changes
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.category;
      return next;
    });
  };

  const handleSubCategoryChange = (subCatId: string) => {
    setFormData((current) => ({
      ...current,
      subCategory: subCatId,
      attributes: {}, // Clear attributes when subcategory changes
    }));
  };

  const setAttribute = (key: string, value: unknown) => {
    setFormData((current) => ({
      ...current,
      attributes: { ...current.attributes, [key]: value },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`attribute.${key}`];
      return next;
    });
  };

  const toggleMultiSelectAttribute = (key: string, optionValue: string) => {
    const current = (formData.attributes[key] as string[]) || [];
    const next = current.includes(optionValue)
      ? current.filter((v) => v !== optionValue)
      : [...current, optionValue];
    setAttribute(key, next);
  };

  const updateVariant = (index: number, patch: Partial<VariantFormData>) => {
    setFormData((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant
      ),
    }));
  };

  const updateVariantAttribute = (index: number, key: string, value: unknown) => {
    setFormData((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index
          ? { ...variant, attributes: { ...variant.attributes, [key]: value } }
          : variant
      ),
    }));
  };

  const addVariant = () => {
    setFormData((current) => ({
      ...current,
      variants: [...current.variants, emptyVariant(current.variants.length + 1)],
    }));
  };

  const removeVariant = (index: number) => {
    setFormData((current) => ({
      ...current,
      variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
    }));
  };

  const buildFormData = (): FormData => {
    const body = new FormData();
    const append = (key: string, value: string | number | boolean) => body.append(key, String(value));

    append('name', formData.name.trim());
    append('sku', formData.sku.trim().toUpperCase());

    // Submit the leaf/specific category ID to the backend
    const categoryToSubmit = formData.subCategory || formData.mainCategory;
    append('category', categoryToSubmit);
    append('brand', formData.brand);
    append('productType', formData.productType);
    append('description', formData.description.trim());
    append('shortDescription', formData.shortDescription.trim());
    append('price', formData.price);
    append('salePrice', formData.salePrice);
    append('compareAtPrice', formData.compareAtPrice);
    append('stock', formData.stock);
    append('status', formData.status);
    append('isFeatured', formData.isFeatured);
    append('isFragile', formData.isFragile);
    append('requiresColdChain', formData.requiresColdChain);
    append('serialTrackingRequired', formData.serialTrackingRequired);
    append('imeiRequired', formData.imeiRequired);
    append('dispatchWeightTolerancePercent', formData.dispatchWeightTolerancePercent);
    append('weightGrams', formData.weightGrams);
    append('lengthCm', formData.lengthCm);
    append('widthCm', formData.widthCm);
    append('heightCm', formData.heightCm);
    append('warrantyMonths', formData.warrantyMonths);

    if (formData.barcode.trim()) append('barcode', formData.barcode.trim());
    if (formData.manufacturer.trim()) append('manufacturer', formData.manufacturer.trim());
    if (formData.modelNumber.trim()) append('modelNumber', formData.modelNumber.trim());
    if (formData.countryOfOrigin.trim()) append('countryOfOrigin', formData.countryOfOrigin.trim());
    if (formData.hazmatClass.trim()) append('hazmatClass', formData.hazmatClass.trim());
    if (formData.taxProfile) append('taxProfile', formData.taxProfile);
    if (formData.returnPolicy) append('returnPolicy', formData.returnPolicy);

    append('attributes', JSON.stringify(formData.attributes));

    const tags = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    append('tags', JSON.stringify(tags));

    const seoKeywords = formData.seoKeywords
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    append(
      'seo',
      JSON.stringify({
        title: formData.seoTitle.trim(),
        description: formData.seoDescription.trim(),
        keywords: seoKeywords,
      })
    );

    const variants = formData.variants.map((variant) => ({
      variantId: variant.variantId,
      name: variant.name.trim(),
      sku: variant.sku.trim().toUpperCase(),
      colorName: variant.colorName.trim() || undefined,
      colorHex: variant.colorHex.trim() || undefined,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      barcode: variant.barcode.trim() || undefined,
      stock: variant.stock,
      weightGrams: variant.weightGrams,
      lengthCm: variant.lengthCm,
      widthCm: variant.widthCm,
      heightCm: variant.heightCm,
      taxProfile: variant.taxProfile || undefined,
      returnPolicy: variant.returnPolicy || undefined,
      isFragile: variant.isFragile,
      requiresColdChain: variant.requiresColdChain,
      hazmatClass: variant.hazmatClass.trim() || undefined,
      serialTrackingRequired: variant.serialTrackingRequired,
      imeiRequired: variant.imeiRequired,
      dispatchWeightTolerancePercent: variant.dispatchWeightTolerancePercent,
      isActive: variant.isActive,
      attributes: variant.attributes,
      images: variant.existingImages,
    }));
    append('variants', JSON.stringify(variants));

    const variantImageMap: Record<string, number[]> = {};
    formData.variants.forEach((variant) => {
      if (variant.galleryIndexes.length) variantImageMap[variant.variantId] = variant.galleryIndexes;
    });
    if (Object.keys(variantImageMap).length) append('variantImageMap', JSON.stringify(variantImageMap));

    if (thumbnailFile) body.append('thumbnail', thumbnailFile);
    galleryFiles.forEach((file) => body.append('images', file));
    return body;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (formData.name.trim().length < 3) nextErrors.name = 'Product name must be at least 3 characters';
    if (formData.sku.trim().length < 3) nextErrors.sku = 'SKU must be at least 3 characters';
    if (!formData.mainCategory) nextErrors.category = 'Main Category must be selected';
    if (!formData.brand) nextErrors.brand = 'Brand must be selected';
    if (formData.description.trim().length < 10) nextErrors.description = 'Description must be at least 10 characters';
    if (formData.shortDescription.trim().length < 5) nextErrors.shortDescription = 'Short description must be at least 5 characters';
    if (formData.price < 0) nextErrors.price = 'Price cannot be negative';
    if (formData.salePrice < 0 || formData.salePrice > formData.price) nextErrors.salePrice = 'Sale price must be between 0 and base price';
    if (formData.compareAtPrice > 0 && formData.compareAtPrice < formData.price) nextErrors.compareAtPrice = 'Compare-at price cannot be lower than base price';
    if (formData.stock < 0 || !Number.isInteger(formData.stock)) nextErrors.stock = 'Stock must be a non-negative whole number';
    if (!isEditing && !thumbnailFile) nextErrors.thumbnail = 'Product thumbnail image is required';

    // Validate required category attributes
    activeAttributes.forEach((definition) => {
      const value = formData.attributes[definition.key];
      const missing = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
      if (definition.required && missing) {
        nextErrors[`attribute.${definition.key}`] = `${definition.name} is required`;
      }
    });

    // Validate variants
    const variantSkus = new Set<string>();
    formData.variants.forEach((variant, index) => {
      const prefix = `variant.${index}`;
      if (!variant.name.trim()) nextErrors[`${prefix}.name`] = 'Variant name is required';
      if (!variant.sku.trim()) nextErrors[`${prefix}.sku`] = 'Variant SKU is required';
      const normalizedSku = variant.sku.trim().toUpperCase();
      if (normalizedSku === formData.sku.trim().toUpperCase()) {
        nextErrors[`${prefix}.sku`] = 'Variant SKU must differ from product SKU';
      }
      if (variantSkus.has(normalizedSku)) {
        nextErrors[`${prefix}.sku`] = 'Variant SKU must be unique';
      }
      variantSkus.add(normalizedSku);

      if (variant.price > 0 && variant.compareAtPrice > 0 && variant.compareAtPrice < variant.price) {
        nextErrors[`${prefix}.compareAtPrice`] = 'Compare-at price cannot be lower than variant price';
      }
      if (variant.stock < 0 || !Number.isInteger(variant.stock)) {
        nextErrors[`${prefix}.stock`] = 'Variant stock must be a whole number';
      }
      if (variant.colorHex && !/^#[0-9a-fA-F]{6}$/.test(variant.colorHex)) {
        nextErrors[`${prefix}.colorHex`] = 'Use hex color like #000000';
      }
    });

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      // Auto switch tab if error is in another tab
      if (nextErrors.name || nextErrors.sku || nextErrors.category || nextErrors.brand || nextErrors.price || nextErrors.salePrice || nextErrors.stock) {
        setActiveTab('basic');
      } else if (nextErrors.shortDescription || nextErrors.description || nextErrors.thumbnail || Object.keys(nextErrors).some((k) => k.startsWith('attribute.'))) {
        setActiveTab('content_media');
      } else if (Object.keys(nextErrors).some((k) => k.startsWith('variant.'))) {
        setActiveTab('variants');
      }
      return;
    }

    try {
      const body = buildFormData();
      if (isEditing && product) {
        await updateMutation.mutateAsync({ id: product._id, data: body });
      } else {
        await createMutation.mutateAsync(body);
      }
      onClose();
    } catch (error: unknown) {
      setErrors({ form: error instanceof Error ? error.message : 'Failed to save product' });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Options for searchable selects
  const mainCategoryOptions: SearchableOption[] = useMemo(
    () => mainCategories.map((c) => ({ value: c._id, label: c.name, sublabel: `/${c.slug}` })),
    [mainCategories]
  );

  const subCategoryOptions: SearchableOption[] = useMemo(
    () => [
      { value: '', label: 'None (Directly under Main Category)' },
      ...subCategories.map((c) => ({ value: c._id, label: c.name, sublabel: `/${c.slug}` })),
    ],
    [subCategories]
  );

  const brandOptions: SearchableOption[] = useMemo(
    () => activeBrands.map((b) => ({ value: b._id, label: b.name, sublabel: b.website ? b.website.replace(/^https?:\/\//, '') : undefined })),
    [activeBrands]
  );

  const taxProfileOptions: SearchableOption[] = useMemo(() => {
    if (activeTaxProfiles.length === 0) {
      return [{ value: '', label: 'No tax profile configured', disabled: true }];
    }
    return [
      { value: '', label: 'No tax profile selected' },
      ...activeTaxProfiles.map((tp) => ({
        value: tp._id,
        label: `${tp.name} (GST ${tp.gstRate}%)`,
        badge: tp.hsnCode ? `HSN ${tp.hsnCode}` : undefined,
      })),
    ];
  }, [activeTaxProfiles]);

  const returnPolicyOptions: SearchableOption[] = useMemo(() => {
    if (activeReturnPolicies.length === 0) {
      return [{ value: '', label: 'No return policy configured', disabled: true }];
    }
    return [
      { value: '', label: 'No return policy selected' },
      ...activeReturnPolicies.map((rp) => ({
        value: rp._id,
        label: `${rp.name} (${rp.returnWindowDays}d ${rp.resolution})`,
      })),
    ];
  }, [activeReturnPolicies]);

  // Tab errors indicator
  const hasBasicErrors = Boolean(errors.name || errors.sku || errors.category || errors.brand || errors.price || errors.salePrice || errors.stock);
  const hasMediaErrors = Boolean(errors.shortDescription || errors.description || errors.thumbnail || Object.keys(errors).some((k) => k.startsWith('attribute.')));
  const hasVariantErrors = Object.keys(errors).some((k) => k.startsWith('variant.'));

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Product: ${product?.sku}` : 'Create New Marketplace Product'}
      description="Category taxonomy, master brand, dynamic attributes, variants, and catalog logistics."
      maxWidth="xl"
      footer={
        <>
          <AdminButton variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </AdminButton>
          <AdminButton variant="primary" size="sm" onClick={handleSubmit} isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Product'}
          </AdminButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        {errors.form && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Tab Sub-navigation for clean compact modal navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'basic', label: '1. Basic & Pricing', hasError: hasBasicErrors },
            { id: 'content_media', label: '2. Media & Attributes', hasError: hasMediaErrors },
            { id: 'variants', label: `3. Variants (${formData.variants.length})`, hasError: hasVariantErrors },
            { id: 'logistics', label: '4. Shipping & Policies' },
            { id: 'seo', label: '5. Tags & SEO' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.hasError && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
            </button>
          ))}
        </div>

        {/* TAB 1: BASIC & PRICING */}
        {activeTab === 'basic' && (
          <div className="space-y-3">
            {/* Identity & Taxonomy */}
            <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-white p-1.5 shadow-2xs ring-1 ring-slate-200">
                  <Package2 className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Basic Information</h4>
                  <p className="text-[10px] text-slate-500">Product identity, category hierarchy and registered brand.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AdminInput
                  label="Product Name *"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  error={errors.name}
                  placeholder="e.g. Nike Air Max Running Shoes"
                />

                <AdminInput
                  label="SKU Code *"
                  value={formData.sku}
                  onChange={(e) => updateField('sku', e.target.value.toUpperCase())}
                  error={errors.sku}
                  placeholder="e.g. NKE-AMX-001"
                  disabled={isEditing}
                  helperText={isEditing ? 'SKU cannot be changed once created.' : 'Parent SKU code.'}
                />

                {/* Main Category Searchable Dropdown */}
                <AdminSearchableSelect
                  label="Category *"
                  required
                  value={formData.mainCategory}
                  onChange={handleMainCategoryChange}
                  options={mainCategoryOptions}
                  placeholder="Select Main Category..."
                  error={errors.category}
                  helperText="Select the top-level category."
                />

                {/* Dependent Subcategory Searchable Dropdown */}
                <AdminSearchableSelect
                  label="Subcategory"
                  value={formData.subCategory}
                  onChange={handleSubCategoryChange}
                  options={subCategoryOptions}
                  placeholder={
                    !formData.mainCategory
                      ? 'Select Category first...'
                      : subCategories.length === 0
                        ? 'No subcategories available'
                        : 'Select Subcategory...'
                  }
                  disabled={!formData.mainCategory || subCategories.length === 0}
                  helperText={
                    !formData.mainCategory
                      ? 'Select Category first to load subcategories.'
                      : subCategories.length === 0
                        ? 'No subcategories found. Product assigns to Main Category.'
                        : 'Filtered subcategories for this category.'
                  }
                />

                {/* Brand Searchable Dropdown - only ACTIVE brands */}
                <AdminSearchableSelect
                  label="Brand *"
                  required
                  value={formData.brand}
                  onChange={(val) => updateField('brand', val)}
                  options={brandOptions}
                  placeholder={activeBrands.length === 0 ? 'No active brands registered' : 'Select Brand...'}
                  error={errors.brand}
                  disabled={activeBrands.length === 0}
                  helperText="Master registered active brand."
                />

                <AdminSelect
                  label="Product Type"
                  value={formData.productType}
                  onChange={(e) => updateField('productType', e.target.value as NonNullable<Product['productType']>)}
                  options={[
                    { value: 'PHYSICAL', label: 'PHYSICAL' },
                    { value: 'DIGITAL', label: 'DIGITAL' },
                    { value: 'SERVICE', label: 'SERVICE' },
                    { value: 'BUNDLE', label: 'BUNDLE' },
                  ]}
                />

                <div className="sm:col-span-2">
                  <AdminInput
                    label="Barcode (UPC / EAN / ISBN)"
                    value={formData.barcode}
                    onChange={(e) => updateField('barcode', e.target.value.toUpperCase())}
                    placeholder="Optional barcode / EAN"
                  />
                </div>
              </div>
            </section>

            {/* Pricing & Stock */}
            <section className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Pricing & Inventory</h4>
                  <p className="text-[10px] text-slate-500">Base price, selling price, MRP and stock count.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <AdminInput
                  label="Base Price (₹) *"
                  type="number"
                  min={0}
                  value={formData.price}
                  onChange={(e) => updateField('price', Number(e.target.value))}
                  error={errors.price}
                />
                <AdminInput
                  label="Sale Price (₹)"
                  type="number"
                  min={0}
                  value={formData.salePrice}
                  onChange={(e) => updateField('salePrice', Number(e.target.value))}
                  error={errors.salePrice}
                  helperText="Must be ≤ Base Price"
                />
                <AdminInput
                  label="Compare-at / MRP (₹)"
                  type="number"
                  min={0}
                  value={formData.compareAtPrice}
                  onChange={(e) => updateField('compareAtPrice', Number(e.target.value))}
                  error={errors.compareAtPrice}
                  helperText="Must be ≥ Base Price"
                />
                <AdminInput
                  label="Initial Stock *"
                  type="number"
                  min={0}
                  step={1}
                  value={formData.stock}
                  onChange={(e) => updateField('stock', Number(e.target.value))}
                  error={errors.stock}
                />
                <AdminSelect
                  label="Catalog Status"
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value as Product['status'])}
                  options={[
                    { value: 'DRAFT', label: 'DRAFT' },
                    { value: 'PENDING_REVIEW', label: 'PENDING REVIEW' },
                    { value: 'ACTIVE', label: 'ACTIVE' },
                    { value: 'INACTIVE', label: 'INACTIVE' },
                    { value: 'OUT_OF_STOCK', label: 'OUT OF STOCK' },
                  ]}
                />
                <label className="mt-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => updateField('isFeatured', e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">Featured Product</span>
                </label>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: MEDIA & ATTRIBUTES */}
        {activeTab === 'content_media' && (
          <div className="space-y-3">
            {/* Product Descriptions */}
            <section className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Product Descriptions</h4>
                <p className="text-[10px] text-slate-500">Short highlight description and detailed product narrative.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700">Short Description *</label>
                <textarea
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => updateField('shortDescription', e.target.value)}
                  className={`mt-1 w-full resize-none rounded-lg border px-3 py-2 text-xs outline-none focus:border-blue-500 ${
                    errors.shortDescription ? 'border-red-400' : 'border-slate-300'
                  }`}
                  placeholder="Brief highlight (at least 5 characters)..."
                />
                {errors.shortDescription && <p className="mt-1 text-[10px] text-red-600">{errors.shortDescription}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700">Full Description *</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className={`mt-1 w-full resize-none rounded-lg border px-3 py-2 text-xs outline-none focus:border-blue-500 ${
                    errors.description ? 'border-red-400' : 'border-slate-300'
                  }`}
                  placeholder="Detailed narrative (at least 10 characters)..."
                />
                {errors.description && <p className="mt-1 text-[10px] text-red-600">{errors.description}</p>}
              </div>
            </section>

            {/* Images with previews */}
            <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-slate-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Product Images</h4>
                  <p className="text-[10px] text-slate-500">
                    Thumbnail is required for new products. Up to 10 gallery images supported.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Thumbnail input with preview */}
                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Thumbnail Image {isEditing ? '(optional)' : '*'}
                    </label>
                    {thumbnailFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailFile(null);
                          setThumbnailPreview(null);
                        }}
                        className="text-[10px] text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover shadow-2xs"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
                        <ImagePlus className="h-5 w-5" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="block w-full text-[10px] text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1.5 file:text-[10px] file:font-semibold"
                    />
                  </div>
                  {errors.thumbnail && <p className="text-[10px] text-red-600">{errors.thumbnail}</p>}
                </div>

                {/* Gallery images */}
                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-slate-700">Gallery Images (up to 10)</label>
                    <span className="text-[10px] text-slate-400">{galleryFiles.length}/10 selected</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryChange}
                    disabled={galleryFiles.length >= 10}
                    className="block w-full text-[10px] text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1.5 file:text-[10px] file:font-semibold"
                  />
                  {galleryPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {galleryPreviews.map((preview, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={preview}
                            alt={`Gallery ${i + 1}`}
                            className="h-10 w-10 rounded border border-slate-200 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryFile(i)}
                            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700"
                            title="Remove file"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Dynamic Category Attributes */}
            <section className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Dynamic Category Attributes</h4>
                  <p className="text-[10px] text-slate-500">
                    Loaded dynamically from category configuration: TEXT, NUMBER, BOOLEAN, SELECT, MULTI_SELECT, DATE.
                  </p>
                </div>
                {effectiveCategoryId && (
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {categories.find((c) => c._id === effectiveCategoryId)?.name || 'Category Attributes'}
                  </span>
                )}
              </div>

              {!effectiveCategoryId ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                  Select a Category or Subcategory in step 1 to dynamically load its configured attributes.
                </div>
              ) : attributesLoading ? (
                <p className="text-center py-6 text-xs text-slate-400">Loading category attributes...</p>
              ) : activeAttributes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                  No dynamic attributes configured for this category. You can configure attributes under Catalog &gt; Categories.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {activeAttributes.map((definition) => {
                    const value = formData.attributes[definition.key];
                    const error = errors[`attribute.${definition.key}`];
                    const label = `${definition.name}${definition.required ? ' *' : ''}${
                      definition.unit ? ` (${definition.unit})` : ''
                    }`;

                    if (definition.dataType === 'BOOLEAN') {
                      return (
                        <label
                          key={definition.key}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 cursor-pointer hover:bg-slate-100"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(e) => setAttribute(definition.key, e.target.checked)}
                            className="rounded border-slate-300 text-blue-600"
                          />
                          <span className="text-[11px] font-semibold text-slate-700">{label}</span>
                        </label>
                      );
                    }

                    if (definition.dataType === 'SELECT') {
                      return (
                        <AdminSelect
                          key={definition.key}
                          label={label}
                          value={typeof value === 'string' ? value : ''}
                          onChange={(e) => setAttribute(definition.key, e.target.value)}
                          error={error}
                          options={[
                            { value: '', label: `Select ${definition.name}...` },
                            ...definition.options.map((opt) => ({ value: opt, label: opt })),
                          ]}
                        />
                      );
                    }

                    if (definition.dataType === 'MULTI_SELECT') {
                      const selectedValues = Array.isArray(value) ? (value as string[]) : [];
                      return (
                        <div key={definition.key} className="space-y-1.5 sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700">
                            {label} <span className="text-[10px] font-normal text-slate-400">(select all that apply)</span>
                          </label>
                          <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-slate-50/60 p-2">
                            {definition.options.map((opt) => {
                              const isChecked = selectedValues.includes(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => toggleMultiSelectAttribute(definition.key, opt)}
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                                    isChecked
                                      ? 'bg-blue-600 text-white shadow-2xs'
                                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {isChecked && <Check className="h-3 w-3" />}
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                          {error && <p className="text-[10px] text-red-600">{error}</p>}
                        </div>
                      );
                    }

                    return (
                      <AdminInput
                        key={definition.key}
                        label={label}
                        type={definition.dataType === 'NUMBER' ? 'number' : definition.dataType === 'DATE' ? 'date' : 'text'}
                        value={value == null ? '' : String(value)}
                        onChange={(e) =>
                          setAttribute(
                            definition.key,
                            definition.dataType === 'NUMBER' ? Number(e.target.value) : e.target.value
                          )
                        }
                        error={error}
                        placeholder={definition.unit ? `e.g. 10 ${definition.unit}` : undefined}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 3: VARIANTS */}
        {activeTab === 'variants' && (
          <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Product Variants</h4>
                <p className="text-[10px] text-slate-500">
                  Manage variants (Size, Color, SKU, attributes, image mappings) directly within this product.
                </p>
              </div>
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                Add Variant
              </AdminButton>
            </div>

            {formData.variants.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-8 text-center text-xs text-slate-400">
                No variants configured yet. Click &quot;Add Variant&quot; if this product has size, color, or separate SKU stock variations.
              </div>
            ) : (
              <div className="space-y-3">
                {formData.variants.map((variant, index) => (
                  <div key={variant.variantId} className="rounded-xl border border-slate-200 bg-white p-3 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{variant.name || `Variant ${index + 1}`}</span>
                        <span className="font-mono text-[10px] text-slate-400">{variant.sku || 'No SKU'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Remove variant"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <AdminInput
                        label="Variant Name *"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, { name: e.target.value })}
                        error={errors[`variant.${index}.name`]}
                        placeholder="e.g. Size 9 / Black"
                      />
                      <AdminInput
                        label="Variant SKU *"
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, { sku: e.target.value.toUpperCase() })}
                        error={errors[`variant.${index}.sku`]}
                        placeholder="e.g. NKE-AMX-001-BLK-9"
                        helperText="Must differ from product SKU and be unique."
                      />
                      <AdminInput
                        label="Color Name"
                        value={variant.colorName}
                        onChange={(e) => updateVariant(index, { colorName: e.target.value })}
                        placeholder="Black"
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <AdminInput
                            label="Color Hex"
                            value={variant.colorHex}
                            onChange={(e) => updateVariant(index, { colorHex: e.target.value })}
                            error={errors[`variant.${index}.colorHex`]}
                            placeholder="#000000"
                          />
                        </div>
                        {variant.colorHex && /^#[0-9a-fA-F]{6}$/.test(variant.colorHex) && (
                          <div
                            className="mt-4 h-7 w-7 shrink-0 rounded-md border border-slate-300 shadow-2xs"
                            style={{ backgroundColor: variant.colorHex }}
                            title={variant.colorHex}
                          />
                        )}
                      </div>
                      <AdminInput
                        label="Variant Price (₹)"
                        type="number"
                        min={0}
                        value={variant.price}
                        onChange={(e) => updateVariant(index, { price: Number(e.target.value) })}
                      />
                      <AdminInput
                        label="Variant Compare-at (₹)"
                        type="number"
                        min={0}
                        value={variant.compareAtPrice}
                        onChange={(e) => updateVariant(index, { compareAtPrice: Number(e.target.value) })}
                        error={errors[`variant.${index}.compareAtPrice`]}
                      />
                      <AdminInput
                        label="Variant Stock *"
                        type="number"
                        min={0}
                        step={1}
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, { stock: Number(e.target.value) })}
                        error={errors[`variant.${index}.stock`]}
                      />
                      <AdminInput
                        label="Barcode"
                        value={variant.barcode}
                        onChange={(e) => updateVariant(index, { barcode: e.target.value.toUpperCase() })}
                      />
                      <AdminSelect
                        label="Tax Profile"
                        value={variant.taxProfile}
                        onChange={(e) => updateVariant(index, { taxProfile: e.target.value })}
                        options={[
                          { value: '', label: 'Use product tax profile' },
                          ...activeTaxProfiles.map((p) => ({ value: p._id, label: `${p.name} (GST ${p.gstRate}%)` })),
                        ]}
                      />
                      <AdminSelect
                        label="Return Policy"
                        value={variant.returnPolicy}
                        onChange={(e) => updateVariant(index, { returnPolicy: e.target.value })}
                        options={[
                          { value: '', label: 'Use product return policy' },
                          ...activeReturnPolicies.map((p) => ({ value: p._id, label: `${p.name} (${p.returnWindowDays}d)` })),
                        ]}
                      />
                    </div>

                    {/* Variant flags */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 pt-1">
                      {(
                        [
                          ['isFragile', 'Fragile'],
                          ['requiresColdChain', 'Cold Chain'],
                          ['serialTrackingRequired', 'Serial Tracking'],
                          ['imeiRequired', 'IMEI Required'],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={variant[key]}
                            onChange={(e) => updateVariant(index, { [key]: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600"
                          />
                          <span className="text-[10px] font-semibold text-slate-600">{label}</span>
                        </label>
                      ))}
                      <label className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                        <input
                          type="checkbox"
                          checked={variant.isActive}
                          onChange={(e) => updateVariant(index, { isActive: e.target.checked })}
                          className="rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-[10px] font-semibold text-slate-600">Active</span>
                      </label>
                    </div>

                    {/* Gallery image assignment for this variant */}
                    {galleryFiles.length > 0 && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/75 p-2 space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-700">Assign Gallery Images to this Variant</p>
                        <div className="flex flex-wrap gap-2">
                          {galleryFiles.map((_, imgIndex) => (
                            <label
                              key={imgIndex}
                              className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] cursor-pointer hover:bg-slate-50"
                            >
                              <input
                                type="checkbox"
                                checked={variant.galleryIndexes.includes(imgIndex)}
                                onChange={(e) =>
                                  updateVariant(index, {
                                    galleryIndexes: e.target.checked
                                      ? [...variant.galleryIndexes, imgIndex]
                                      : variant.galleryIndexes.filter((v) => v !== imgIndex),
                                  })
                                }
                                className="rounded border-slate-300 text-blue-600"
                              />
                              <span>Image {imgIndex + 1}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Variant specific category attributes */}
                    {activeAttributes.length > 0 && (
                      <div className="border-t border-slate-100 pt-2 space-y-2">
                        <p className="text-[10px] font-bold text-slate-700">Variant-Level Category Attributes</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {activeAttributes.map((definition) => {
                            const val = variant.attributes[definition.key];
                            if (definition.dataType === 'SELECT') {
                              return (
                                <AdminSelect
                                  key={definition.key}
                                  label={definition.name}
                                  value={typeof val === 'string' ? val : ''}
                                  onChange={(e) => updateVariantAttribute(index, definition.key, e.target.value)}
                                  options={[
                                    { value: '', label: `Select ${definition.name}...` },
                                    ...definition.options.map((opt) => ({ value: opt, label: opt })),
                                  ]}
                                />
                              );
                            }
                            if (definition.dataType === 'BOOLEAN') {
                              return (
                                <label
                                  key={definition.key}
                                  className="mt-5 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={Boolean(val)}
                                    onChange={(e) => updateVariantAttribute(index, definition.key, e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600"
                                  />
                                  <span className="text-[10px] font-semibold text-slate-600">{definition.name}</span>
                                </label>
                              );
                            }
                            return (
                              <AdminInput
                                key={definition.key}
                                label={definition.name}
                                type={
                                  definition.dataType === 'NUMBER'
                                    ? 'number'
                                    : definition.dataType === 'DATE'
                                      ? 'date'
                                      : 'text'
                                }
                                value={val == null ? '' : String(val)}
                                onChange={(e) =>
                                  updateVariantAttribute(
                                    index,
                                    definition.key,
                                    definition.dataType === 'NUMBER' ? Number(e.target.value) : e.target.value
                                  )
                                }
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: SHIPPING & POLICIES */}
        {activeTab === 'logistics' && (
          <div className="space-y-3">
            {/* Master Tax and Return Policies */}
            <section className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Tax Profile & Return Policy</h4>
                  <p className="text-[10px] text-slate-500">
                    Master catalog configurations from backend registry. Do not hardcode rules.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AdminSearchableSelect
                  label="Tax Profile"
                  value={formData.taxProfile}
                  onChange={(val) => updateField('taxProfile', val)}
                  options={taxProfileOptions}
                  placeholder="Select Tax Profile..."
                  clearable
                  helperText={
                    activeTaxProfiles.length === 0
                      ? 'No active tax profile found. Configure in Catalog Master.'
                      : 'Applicable GST / HSN rate profile.'
                  }
                />

                <AdminSearchableSelect
                  label="Return Policy"
                  value={formData.returnPolicy}
                  onChange={(val) => updateField('returnPolicy', val)}
                  options={returnPolicyOptions}
                  placeholder="Select Return Policy..."
                  clearable
                  helperText={
                    activeReturnPolicies.length === 0
                      ? 'No active return policy found. Configure in Catalog Master.'
                      : 'Applicable return window & resolution.'
                  }
                />
              </div>
            </section>

            {/* Shipping & Logistics */}
            <section className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-slate-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Logistics & Dimensions</h4>
                    <p className="text-[10px] text-slate-500">Physical package specifications used by courier partners.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedShipping((prev) => !prev)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline"
                >
                  <span>{showAdvancedShipping ? 'Hide extra' : 'Show extra'}</span>
                  {showAdvancedShipping ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <AdminInput
                  label="Weight (g)"
                  type="number"
                  min={0}
                  value={formData.weightGrams}
                  onChange={(e) => updateField('weightGrams', Number(e.target.value))}
                  placeholder="e.g. 800"
                />
                <AdminInput
                  label="Length (cm)"
                  type="number"
                  min={0}
                  value={formData.lengthCm}
                  onChange={(e) => updateField('lengthCm', Number(e.target.value))}
                  placeholder="e.g. 30"
                />
                <AdminInput
                  label="Width (cm)"
                  type="number"
                  min={0}
                  value={formData.widthCm}
                  onChange={(e) => updateField('widthCm', Number(e.target.value))}
                  placeholder="e.g. 20"
                />
                <AdminInput
                  label="Height (cm)"
                  type="number"
                  min={0}
                  value={formData.heightCm}
                  onChange={(e) => updateField('heightCm', Number(e.target.value))}
                  placeholder="e.g. 12"
                />
              </div>

              {showAdvancedShipping && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-slate-100">
                  <AdminInput
                    label="Manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => updateField('manufacturer', e.target.value)}
                    placeholder="e.g. Nike Sports India"
                  />
                  <AdminInput
                    label="Model Number"
                    value={formData.modelNumber}
                    onChange={(e) => updateField('modelNumber', e.target.value)}
                    placeholder="e.g. AMX-2026"
                  />
                  <AdminInput
                    label="Country of Origin"
                    value={formData.countryOfOrigin}
                    onChange={(e) => updateField('countryOfOrigin', e.target.value)}
                    placeholder="e.g. India"
                  />
                  <AdminInput
                    label="Warranty (months)"
                    type="number"
                    min={0}
                    value={formData.warrantyMonths}
                    onChange={(e) => updateField('warrantyMonths', Number(e.target.value))}
                  />
                  <AdminInput
                    label="Hazmat Class"
                    value={formData.hazmatClass}
                    onChange={(e) => updateField('hazmatClass', e.target.value.toUpperCase())}
                    placeholder="e.g. CLASS-9"
                  />
                  <AdminInput
                    label="Weight Tolerance (%)"
                    type="number"
                    min={0}
                    max={50}
                    value={formData.dispatchWeightTolerancePercent}
                    onChange={(e) => updateField('dispatchWeightTolerancePercent', Number(e.target.value))}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 pt-1">
                {(
                  [
                    ['isFragile', 'Fragile'],
                    ['requiresColdChain', 'Cold Chain'],
                    ['serialTrackingRequired', 'Serial Tracking'],
                    ['imeiRequired', 'IMEI Required'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                    <input
                      type="checkbox"
                      checked={formData[key]}
                      onChange={(e) => updateField(key, e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="text-[10px] font-semibold text-slate-600">{label}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 5: TAGS & SEO */}
        {activeTab === 'seo' && (
          <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Discovery Tags & SEO Metadata</h4>
                <p className="text-[10px] text-slate-500">
                  Catalog search tags are separate from search engine metadata.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <AdminInput
                label="Product Discovery Tags"
                value={formData.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                placeholder="e.g. nike, running shoes, sports shoes, sneakers"
                helperText="Comma-separated keywords for internal catalog search."
              />

              <div className="border-t border-slate-200 pt-3 space-y-3">
                <p className="text-xs font-bold text-slate-800">Search Engine Optimization (SEO)</p>
                <AdminInput
                  label="SEO Title"
                  value={formData.seoTitle}
                  onChange={(e) => updateField('seoTitle', e.target.value)}
                  placeholder="e.g. Nike Air Max Running Shoes | RG Enterprises"
                />
                <AdminInput
                  label="SEO Description"
                  value={formData.seoDescription}
                  onChange={(e) => updateField('seoDescription', e.target.value)}
                  placeholder="Meta snippet description for Google & search engines..."
                />
                <AdminInput
                  label="SEO Keywords"
                  value={formData.seoKeywords}
                  onChange={(e) => updateField('seoKeywords', e.target.value)}
                  placeholder="e.g. nike shoes, athletic sneakers, running shoes men"
                />
              </div>
            </div>
          </section>
        )}
      </form>
    </AdminModal>
  );
}
