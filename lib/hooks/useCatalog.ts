'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList } from '@/lib/api/normalize';
import type { Brand, Category } from '@/lib/api/types';

type Raw = Record<string, unknown>;
const obj = (value: unknown): Raw | undefined => (value && typeof value === 'object' ? (value as Raw) : undefined);
const imageUrl = (value: unknown): string | undefined =>
  typeof value === 'string' ? value || undefined : typeof obj(value)?.url === 'string' ? String(obj(value)!.url) : undefined;

export interface CategoryAttribute {
  _id: string;
  name: string;
  key: string;
  dataType: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT' | 'DATE';
  required: boolean;
  options: string[];
  unit?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface TaxProfile {
  _id: string;
  name: string;
  hsnCode?: string;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cessRate: number;
  inclusive: boolean;
  isActive: boolean;
}

export interface TaxProfileInput {
  name: string;
  hsnCode?: string;
  gstRate: number;
  cessRate: number;
  inclusive: boolean;
  isActive: boolean;
}

export interface ReturnPolicy {
  _id: string;
  name: string;
  isReturnable: boolean;
  returnWindowDays: number;
  isActive: boolean;
}

function normalizeCategory(row: Raw): Category {
  const parent = row.parentCategory;
  const seo = obj(row.seo);
  return {
    _id: String(row._id ?? ''),
    name: String(row.name ?? ''),
    slug: String(row.slug ?? ''),
    parentId: typeof parent === 'string' ? parent : obj(parent) ? String(obj(parent)!._id ?? '') : null,
    parentName: obj(parent) ? String(obj(parent)!.name ?? '') : undefined,
    status: row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    productCount: Number(row.productCount ?? 0),
    image: imageUrl(row.image),
    description: typeof row.description === 'string' ? row.description : undefined,
    sortOrder: Number(row.sortOrder ?? 0),
    seo: seo ? { title: String(seo.title ?? ''), description: String(seo.description ?? ''), keywords: Array.isArray(seo.keywords) ? seo.keywords.map(String) : [] } : undefined,
  };
}

function normalizeBrand(row: Raw): Brand {
  const seo = obj(row.seo);
  return {
    _id: String(row._id ?? ''),
    name: String(row.name ?? ''),
    slug: String(row.slug ?? ''),
    logo: imageUrl(row.logo),
    status: row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    productCount: Number(row.productCount ?? 0),
    website: typeof row.website === 'string' ? row.website : undefined,
    description: typeof row.description === 'string' ? row.description : undefined,
    sortOrder: Number(row.sortOrder ?? 0),
    seo: seo ? { title: String(seo.title ?? ''), description: String(seo.description ?? ''), keywords: Array.isArray(seo.keywords) ? seo.keywords.map(String) : [] } : undefined,
  };
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.categories.list, { params: { page: 1, limit: 100 } });
      return normalizeList<Raw>(res, ['categories']).map(normalizeCategory).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
    },
    staleTime: 60_000,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: queryKeys.brands,
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.brands.list, { params: { page: 1, limit: 100 } });
      return normalizeList<Raw>(res, ['brands']).map(normalizeBrand).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
    },
    staleTime: 60_000,
  });
}

/** Create/update/delete for categories and brands (both send multipart form data with an optional image). */
function useCatalogMutations(kind: 'categories' | 'brands') {
  const queryClient = useQueryClient();
  const endpoints = ENDPOINTS[kind];
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys[kind] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  };
  return {
    create: useMutation({ mutationFn: (body: FormData) => api.post<unknown>(endpoints.create, body), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, body }: { id: string; body: FormData }) => api.put<unknown>(endpoints.update(id), body), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => api.delete<unknown>(endpoints.delete(id)), onSuccess: invalidate }),
  };
}

export const useCategoryMutations = () => useCatalogMutations('categories');
export const useBrandMutations = () => useCatalogMutations('brands');

/** Extra fields a category asks for on its products (e.g. RAM, sole material). */
export function useCategoryAttributes(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.catalogConfig.attributes(categoryId),
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.catalogConfig.attributes, { params: { category: categoryId } });
      return normalizeList<Raw>(res)
        .map(
          (row): CategoryAttribute => ({
            _id: String(row._id ?? ''),
            name: String(row.name ?? ''),
            key: String(row.key ?? ''),
            dataType: String(row.dataType ?? 'TEXT') as CategoryAttribute['dataType'],
            required: Boolean(row.required),
            options: Array.isArray(row.options) ? row.options.filter((v): v is string => typeof v === 'string') : [],
            unit: typeof row.unit === 'string' ? row.unit : undefined,
            sortOrder: Number(row.sortOrder ?? 0),
            isActive: row.isActive !== false,
          })
        )
        .filter((attribute) => attribute.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },
    enabled: Boolean(categoryId),
    staleTime: 60_000,
  });
}

export function useTaxProfiles() {
  return useQuery({
    queryKey: queryKeys.catalogConfig.taxProfiles,
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.catalogConfig.taxProfiles);
      return normalizeList<Raw>(res).map(
        (row): TaxProfile => ({
          _id: String(row._id ?? ''),
          name: String(row.name ?? ''),
          hsnCode: typeof row.hsnCode === 'string' ? row.hsnCode : undefined,
          gstRate: Number(row.gstRate ?? 0),
          cgstRate: Number(row.cgstRate ?? 0),
          sgstRate: Number(row.sgstRate ?? 0),
          igstRate: Number(row.igstRate ?? 0),
          cessRate: Number(row.cessRate ?? 0),
          inclusive: row.inclusive !== false,
          isActive: row.isActive !== false,
        })
      );
    },
    staleTime: 60_000,
  });
}

/** GST is split CGST + SGST within the state and IGST across states; the rates follow from the GST rate. */
function taxBody(input: TaxProfileInput) {
  return {
    name: input.name.trim(),
    ...(input.hsnCode?.trim() ? { hsnCode: input.hsnCode.trim() } : {}),
    gstRate: input.gstRate,
    cgstRate: input.gstRate / 2,
    sgstRate: input.gstRate / 2,
    igstRate: input.gstRate,
    cessRate: input.cessRate,
    inclusive: input.inclusive,
    isActive: input.isActive,
  };
}

export function useTaxProfileMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.catalogConfig.taxProfiles });
  return {
    create: useMutation({ mutationFn: (input: TaxProfileInput) => api.post<unknown>(ENDPOINTS.catalogConfig.taxProfiles, taxBody(input)), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: TaxProfileInput }) => api.patch<unknown>(ENDPOINTS.catalogConfig.taxProfile(id), taxBody(input)),
      onSuccess: invalidate,
    }),
  };
}

export function useReturnPolicies(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.catalogConfig.returnPolicies(categoryId),
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.catalogConfig.returnPolicies, { params: categoryId ? { category: categoryId } : undefined });
      return normalizeList<Raw>(res)
        .map(
          (row): ReturnPolicy => ({
            _id: String(row._id ?? ''),
            name: String(row.name ?? ''),
            isReturnable: row.isReturnable !== false,
            returnWindowDays: Number(row.returnWindowDays ?? 0),
            isActive: row.isActive !== false,
          })
        )
        .filter((policy) => policy.isActive);
    },
    staleTime: 60_000,
  });
}
