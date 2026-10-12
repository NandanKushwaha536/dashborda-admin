'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList } from '@/lib/api/normalize';

/** A home page hero banner (backend: a BANNER campaign, /admin/campaigns). */
export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  live: boolean;
}

export type BannerInput = Omit<Banner, 'id'>;

type Raw = Record<string, unknown>;
const str = (value: unknown) => (typeof value === 'string' ? value : '');

function mapBanner(raw: Raw): Banner {
  const content = raw.content && typeof raw.content === 'object' ? (raw.content as Raw) : {};
  return {
    id: String(raw._id ?? raw.id ?? ''),
    title: str(content.title) || str(raw.name),
    subtitle: str(content.subtitle),
    tag: str(content.tag),
    image: str(content.image),
    ctaText: str(content.ctaText),
    ctaLink: str(content.ctaLink),
    live: raw.status === 'ACTIVE',
  };
}

function toBody(input: BannerInput) {
  const title = input.title.trim();
  return {
    name: title,
    type: 'BANNER',
    status: input.live ? 'ACTIVE' : 'PAUSED',
    content: {
      title,
      subtitle: input.subtitle.trim(),
      tag: input.tag.trim(),
      image: input.image.trim(),
      ctaText: input.ctaText.trim(),
      ctaLink: input.ctaLink.trim(),
    },
  };
}

export function useBanners() {
  return useQuery({
    queryKey: queryKeys.banners,
    queryFn: async () => {
      const res = await api.get<unknown>(ENDPOINTS.banners.list, { params: { type: 'BANNER', limit: 50, sortBy: 'createdAt', sortOrder: 'asc' } });
      return normalizeList<Raw>(res, ['campaigns']).map(mapBanner).filter((b) => b.id);
    },
    staleTime: 30_000,
  });
}

export function useBannerMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.banners });
  return {
    create: useMutation({ mutationFn: (input: BannerInput) => api.post<unknown>(ENDPOINTS.banners.create, toBody(input)), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: BannerInput }) => api.patch<unknown>(ENDPOINTS.banners.update(id), toBody(input)),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => api.delete<unknown>(ENDPOINTS.banners.remove(id)), onSuccess: invalidate }),
    uploadImage: useMutation({
      mutationFn: async (file: File) => {
        const body = new FormData();
        body.append('image', file);
        const res = await api.post<{ url?: string } | { data?: { url?: string } }>(ENDPOINTS.banners.image, body);
        const url = (res as { url?: string })?.url ?? (res as { data?: { url?: string } })?.data?.url;
        if (!url) throw new Error('The picture could not be uploaded. Please try again.');
        return url;
      },
    }),
  };
}
