'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';

export type SearchResultType = 'Order' | 'Product' | 'Customer' | 'Category' | 'Brand';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  name: string;
  description: string;
  href: string;
}

/**
 * Header search across orders, products, customers, categories and brands.
 * The backend only returns the kinds the signed-in role may open.
 */
export function useGlobalSearch(term: string) {
  const q = term.trim();
  return useQuery({
    queryKey: queryKeys.search(q),
    queryFn: async (): Promise<SearchResult[]> => {
      const res = await api.get<{ data?: SearchResult[] }>(ENDPOINTS.search, { params: { q, limit: 6 } });
      return Array.isArray(res.data) ? res.data.filter((row) => typeof row.href === 'string' && row.href.startsWith('/admin')) : [];
    },
    enabled: q.length >= 2,
    staleTime: 15_000,
  });
}
