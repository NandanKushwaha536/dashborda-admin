'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { Product } from '@/lib/api/types';
import { normalizeList, normalizeLimit, normalizePage, normalizeTotal } from '@/lib/api/normalize';

export interface ProductFilterParams {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  status?: string;
  search?: string;
}

function normalizeProduct(row: Record<string, unknown>): Product {
  const category = row.category && typeof row.category === 'object' ? row.category as Record<string, unknown> : undefined;
  const brand = row.brand && typeof row.brand === 'object' ? row.brand as Record<string, unknown> : undefined;
  const thumbnail = row.thumbnail && typeof row.thumbnail === 'object' ? row.thumbnail as Record<string, unknown> : undefined;
  const seo = row.seo && typeof row.seo === 'object' ? row.seo as Record<string, unknown> : undefined;
  const images = Array.isArray(row.images)
    ? row.images.map((image) => {
        if (typeof image === 'string') return image;
        if (image && typeof image === 'object' && typeof (image as Record<string, unknown>).url === 'string') {
          return String((image as Record<string, unknown>).url);
        }
        return '';
      }).filter(Boolean)
    : [];

  return {
    _id: String(row._id ?? row.id ?? ''),
    name: String(row.name ?? 'Product'),
    slug: String(row.slug ?? ''),
    sku: String(row.sku ?? ''),
    category: String(category?._id ?? category?.id ?? row.category ?? ''),
    categoryName: String(row.categoryName ?? category?.name ?? ''),
    brand: String(brand?._id ?? brand?.id ?? row.brand ?? ''),
    brandName: String(row.brandName ?? brand?.name ?? ''),
    price: Number(row.price ?? 0),
    salePrice: Number(row.salePrice ?? 0),
    compareAtPrice: row.compareAtPrice == null ? undefined : Number(row.compareAtPrice),
    barcode: typeof row.barcode === 'string' ? row.barcode : undefined,
    productType: String(row.productType ?? 'PHYSICAL') as Product['productType'],
    taxProfile: typeof row.taxProfile === 'object' && row.taxProfile !== null ? String((row.taxProfile as Record<string, unknown>)._id ?? '') : typeof row.taxProfile === 'string' ? row.taxProfile : undefined,
    returnPolicy: typeof row.returnPolicy === 'object' && row.returnPolicy !== null ? String((row.returnPolicy as Record<string, unknown>)._id ?? '') : typeof row.returnPolicy === 'string' ? row.returnPolicy : undefined,
    stock: Number(row.stock ?? 0),
    trackInventory: true,
    status: String(row.status ?? 'DRAFT') as Product['status'],
    rating: Number(row.rating ?? 0),
    reviewsCount: Number(row.reviewCount ?? row.reviewsCount ?? 0),
    shortDescription: typeof row.shortDescription === 'string' ? row.shortDescription : undefined,
    description: typeof row.description === 'string' ? row.description : undefined,
    mainImage: String(thumbnail?.url ?? row.mainImage ?? ''),
    thumbnail: thumbnail
      ? { url: String(thumbnail.url ?? ''), publicId: String(thumbnail.publicId ?? '') }
      : undefined,
    images,
    variants: Array.isArray(row.variants) ? row.variants.map((item) => {
      const variant = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      const images = Array.isArray(variant.images) ? variant.images.filter((image): image is { url: string; publicId: string } => Boolean(image && typeof image === 'object' && typeof (image as Record<string, unknown>).url === 'string')).map((image) => ({ url: image.url, publicId: String(image.publicId ?? '') })) : [];
      return {
        variantId: typeof variant.variantId === 'string' ? variant.variantId : undefined,
        sku: String(variant.sku ?? ''),
        name: typeof variant.name === 'string' ? variant.name : undefined,
        price: variant.price == null ? undefined : Number(variant.price),
        compareAtPrice: variant.compareAtPrice == null ? undefined : Number(variant.compareAtPrice),
        stock: variant.stock == null ? undefined : Number(variant.stock),
        barcode: typeof variant.barcode === 'string' ? variant.barcode : undefined,
        colorName: typeof variant.colorName === 'string' ? variant.colorName : undefined,
        colorHex: typeof variant.colorHex === 'string' ? variant.colorHex : undefined,
        isActive: variant.isActive !== false,
        images,
        attributes: variant.attributes && typeof variant.attributes === 'object' ? variant.attributes as Record<string, unknown> : {},
        weightGrams: variant.weightGrams == null ? undefined : Number(variant.weightGrams),
        lengthCm: variant.lengthCm == null ? undefined : Number(variant.lengthCm),
        widthCm: variant.widthCm == null ? undefined : Number(variant.widthCm),
        heightCm: variant.heightCm == null ? undefined : Number(variant.heightCm),
        taxProfile: typeof variant.taxProfile === 'object' && variant.taxProfile !== null ? String((variant.taxProfile as Record<string, unknown>)._id ?? '') : typeof variant.taxProfile === 'string' ? variant.taxProfile : undefined,
        returnPolicy: typeof variant.returnPolicy === 'object' && variant.returnPolicy !== null ? String((variant.returnPolicy as Record<string, unknown>)._id ?? '') : typeof variant.returnPolicy === 'string' ? variant.returnPolicy : undefined,
        isFragile: Boolean(variant.isFragile),
        requiresColdChain: Boolean(variant.requiresColdChain),
        hazmatClass: typeof variant.hazmatClass === 'string' ? variant.hazmatClass : undefined,
        serialTrackingRequired: Boolean(variant.serialTrackingRequired),
        imeiRequired: Boolean(variant.imeiRequired),
        dispatchWeightTolerancePercent: variant.dispatchWeightTolerancePercent == null ? undefined : Number(variant.dispatchWeightTolerancePercent),
      };
    }) : [],
    seoTitle: typeof seo?.title === 'string' ? seo.title : undefined,
    seoDescription: typeof seo?.description === 'string' ? seo.description : undefined,
    seoKeywords: Array.isArray(seo?.keywords) ? seo.keywords.join(', ') : undefined,
    featured: Boolean(row.isFeatured ?? row.featured),
    isFeatured: Boolean(row.isFeatured ?? row.featured),
    tags: Array.isArray(row.tags) ? row.tags.filter((x): x is string => typeof x === 'string') : [],
    attributes: row.attributes && typeof row.attributes === 'object' ? row.attributes as Record<string, unknown> : {},
    weightGrams: Number(row.weightGrams ?? 0),
    lengthCm: Number(row.lengthCm ?? 0),
    widthCm: Number(row.widthCm ?? 0),
    heightCm: Number(row.heightCm ?? 0),
    manufacturer: typeof row.manufacturer === 'string' ? row.manufacturer : undefined,
    modelNumber: typeof row.modelNumber === 'string' ? row.modelNumber : undefined,
    countryOfOrigin: typeof row.countryOfOrigin === 'string' ? row.countryOfOrigin : undefined,
    warrantyMonths: Number(row.warrantyMonths ?? 0),
    isFragile: Boolean(row.isFragile),
    requiresColdChain: Boolean(row.requiresColdChain),
    hazmatClass: typeof row.hazmatClass === 'string' ? row.hazmatClass : undefined,
    serialTrackingRequired: Boolean(row.serialTrackingRequired),
    imeiRequired: Boolean(row.imeiRequired),
    dispatchWeightTolerancePercent: Number(row.dispatchWeightTolerancePercent ?? 10),
    seo,
    createdAt: String(row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? row.createdAt ?? new Date().toISOString()),
  };
}

export function useProducts(params: ProductFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.products.list, {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          category: params.category || undefined,
          brand: params.brand || undefined,
          status: params.status || undefined,
          search: params.search || undefined,
        },
      });
      const raw = normalizeList<Record<string, unknown>>(res, ['products']);
      const products = raw.map(normalizeProduct);
      return {
        products,
        total: normalizeTotal(res, products.length),
        page: normalizePage(res, params.page ?? 1),
        limit: normalizeLimit(res, params.limit ?? 20),
      };
    },
    staleTime: 30_000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.products.detail(id));
      if (res && typeof res === 'object') {
        const object = res as Record<string, unknown>;
        const raw = object.data ?? object.product ?? object;
        if (raw && typeof raw === 'object') return normalizeProduct(raw as Record<string, unknown>);
      }
      throw new Error('Invalid product response');
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData) => api.post<{ success: boolean; data: Product }>(ENDPOINTS.products.create, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => api.put<{ success: boolean; data: Product }>(ENDPOINTS.products.update(id), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete<{ success: boolean }>(ENDPOINTS.products.delete(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useBulkProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productIds, status }: { productIds: string[]; status: string }) => {
      const results = await Promise.allSettled(
        productIds.map((id) => api.put<{ success: boolean; data: Product }>(ENDPOINTS.products.update(id), { status }))
      );
      const updatedCount = results.filter((result) => result.status === 'fulfilled').length;
      const failed = results.filter((result) => result.status === 'rejected');
      if (failed.length > 0 && updatedCount === 0) throw (failed[0] as PromiseRejectedResult).reason;
      return { success: true, updatedCount };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useBulkProductDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productIds: string[]) => {
      const results = await Promise.allSettled(productIds.map((id) => api.delete<{ success: boolean }>(ENDPOINTS.products.delete(id))));
      const deletedCount = results.filter((result) => result.status === 'fulfilled').length;
      const failed = results.filter((result) => result.status === 'rejected');
      if (failed.length > 0 && deletedCount === 0) throw (failed[0] as PromiseRejectedResult).reason;
      return { success: true, deletedCount };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}
