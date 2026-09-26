'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { Category, Brand } from '@/lib/api/types';
import { normalizeList } from '@/lib/api/normalize';

export interface CategoryAttribute {
  _id: string;
  category: string;
  name: string;
  key: string;
  dataType: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT' | 'DATE';
  required: boolean;
  filterable: boolean;
  searchable: boolean;
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
  category?: string;
  isActive: boolean;
}

export interface ReturnPolicy {
  _id: string;
  name: string;
  category?: string;
  isReturnable: boolean;
  returnWindowDays: number;
  resolution: 'REFUND' | 'REPLACEMENT' | 'BOTH' | 'NONE';
  requiresInspection: boolean;
  isActive: boolean;
}

function normalizeCategory(row: Category & Record<string, unknown>): Category {
  const parent = row.parentCategory;
  const parentId = typeof parent === 'object' && parent !== null
    ? String((parent as Record<string, unknown>)._id ?? '')
    : typeof parent === 'string'
      ? parent
      : row.parentId ?? null;
  const seo = row.seo && typeof row.seo === 'object' ? row.seo as Record<string, unknown> : undefined;
  const image = row.image && typeof row.image === 'object'
    ? String((row.image as Record<string, unknown>).url ?? '')
    : typeof row.image === 'string' ? row.image : undefined;

  return {
    ...row,
    _id: String(row._id),
    name: String(row.name ?? ''),
    slug: String(row.slug ?? ''),
    parentId,
    parentName: typeof row.parentName === 'string'
      ? row.parentName
      : typeof parent === 'object' && parent !== null
        ? String((parent as Record<string, unknown>).name ?? '')
        : undefined,
    status: row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    productCount: Number(row.productCount ?? 0),
    image,
    description: typeof row.description === 'string' ? row.description : undefined,
    sortOrder: Number(row.sortOrder ?? 0),
    seo,
    seoTitle: typeof seo?.title === 'string' ? seo.title : undefined,
    seoDescription: typeof seo?.description === 'string' ? seo.description : undefined,
    seoKeywords: Array.isArray(seo?.keywords) ? seo.keywords.join(', ') : undefined,
  };
}

function normalizeBrand(row: Brand & Record<string, unknown>): Brand {
  const logo = row.logo && typeof row.logo === 'object'
    ? String((row.logo as Record<string, unknown>).url ?? '')
    : typeof row.logo === 'string' ? row.logo : undefined;
  const seo = row.seo && typeof row.seo === 'object' ? row.seo as Record<string, unknown> : undefined;
  return {
    ...row,
    _id: String(row._id),
    name: String(row.name ?? ''),
    slug: String(row.slug ?? ''),
    logo,
    status: row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    productCount: Number(row.productCount ?? 0),
    sortOrder: Number(row.sortOrder ?? 0),
    seo,
  };
}

export function useCategories(search?: string) {
  return useQuery({
    queryKey: queryKeys.categories.list(search ? { search } : undefined),
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.categories.list, {
        params: { page: 1, limit: 100, ...(search ? { search } : {}) },
      });
      return normalizeList<Record<string, unknown>>(res, ['categories']).map((row) => normalizeCategory(row as Category & Record<string, unknown>));
    },
    staleTime: 60_000,
  });
}

export function useBrands(search?: string) {
  return useQuery({
    queryKey: queryKeys.brands.list(search ? { search } : undefined),
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.brands.list, {
        params: { page: 1, limit: 100, ...(search ? { search } : {}) },
      });
      return normalizeList<Record<string, unknown>>(res, ['brands']).map((row) => normalizeBrand(row as Brand & Record<string, unknown>));
    },
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData) => api.post<{ success: boolean; data: Category }>(ENDPOINTS.categories.create, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => api.put<{ success: boolean; data: Category }>(ENDPOINTS.categories.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete<{ success: boolean }>(ENDPOINTS.categories.delete(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData) => api.post<{ success: boolean; data: Brand }>(ENDPOINTS.brands.create, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.brands.all }),
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => api.put<{ success: boolean; data: Brand }>(ENDPOINTS.brands.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete<{ success: boolean }>(ENDPOINTS.brands.delete(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.brands.all }),
  });
}

export function useCategoryAttributes(categoryId?: string) {
  return useQuery({
    queryKey: ['catalog', 'category-attributes', categoryId || 'all'],
    queryFn: async () => {
      const res = await api.get<unknown>('/admin/catalog-config/attributes', {
        params: categoryId ? { category: categoryId } : undefined,
      });
      return normalizeList<Record<string, unknown>>(res).map((row) => ({
        _id: String(row._id ?? ''),
        category: String(row.category ?? ''),
        name: String(row.name ?? ''),
        key: String(row.key ?? ''),
        dataType: String(row.dataType ?? 'TEXT') as CategoryAttribute['dataType'],
        required: Boolean(row.required),
        filterable: Boolean(row.filterable),
        searchable: Boolean(row.searchable),
        options: Array.isArray(row.options) ? row.options.filter((v): v is string => typeof v === 'string') : [],
        unit: typeof row.unit === 'string' ? row.unit : undefined,
        sortOrder: Number(row.sortOrder ?? 0),
        isActive: Boolean(row.isActive),
      } satisfies CategoryAttribute));
    },
    enabled: Boolean(categoryId),
    staleTime: 60_000,
  });
}

export function useAllCategoryAttributes(categoryId?: string) {
  return useQuery({
    queryKey: ['catalog', 'category-attributes-all', categoryId || 'all'],
    queryFn: async () => {
      const res = await api.get<unknown>('/admin/catalog-config/attributes', {
        params: categoryId && categoryId !== 'all' ? { category: categoryId } : undefined,
      });
      return normalizeList<Record<string, unknown>>(res).map((row) => ({
        _id: String(row._id ?? ''),
        category: String(row.category ?? ''),
        name: String(row.name ?? ''),
        key: String(row.key ?? ''),
        dataType: String(row.dataType ?? 'TEXT') as CategoryAttribute['dataType'],
        required: Boolean(row.required),
        filterable: Boolean(row.filterable),
        searchable: Boolean(row.searchable),
        options: Array.isArray(row.options) ? row.options.filter((v): v is string => typeof v === 'string') : [],
        unit: typeof row.unit === 'string' ? row.unit : undefined,
        sortOrder: Number(row.sortOrder ?? 0),
        isActive: Boolean(row.isActive),
      } satisfies CategoryAttribute));
    },
    staleTime: 60_000,
  });
}

export function useCreateCategoryAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<CategoryAttribute, '_id'>) => api.post<{ success: boolean; data: CategoryAttribute }>('/admin/catalog-config/attributes', payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'category-attributes', variables.category] });
    },
  });
}

export function useUpdateCategoryAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryAttribute> }) => api.patch<{ success: boolean; data: CategoryAttribute }>(`/admin/catalog-config/attributes/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'category-attributes', variables.data.category ?? 'all'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'category-attributes'] });
    },
  });
}

export function useTaxProfiles() {
  return useQuery({
    queryKey: ['catalog', 'tax-profiles'],
    queryFn: async () => {
      const res = await api.get<unknown>('/admin/catalog-config/tax-profiles');
      return normalizeList<Record<string, unknown>>(res) as unknown as TaxProfile[];
    },
    staleTime: 60_000,
  });
}

export function useReturnPolicies(categoryId?: string) {
  return useQuery({
    queryKey: ['catalog', 'return-policies', categoryId || 'all'],
    queryFn: async () => {
      const res = await api.get<unknown>('/admin/catalog-config/return-policies', {
        params: categoryId ? { category: categoryId } : undefined,
      });
      return normalizeList<Record<string, unknown>>(res) as unknown as ReturnPolicy[];
    },
    staleTime: 60_000,
  });
}
