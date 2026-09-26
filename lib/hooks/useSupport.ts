'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';
import { normalizeList } from '@/lib/api/normalize';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  subject: string;
  orderNumber?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

export function useSupportTickets() {
  return useQuery({
    queryKey: queryKeys.support.tickets(),
    queryFn: async () => {
      const res = await api.get<{
        success?: boolean;
        data?: SupportTicket[];
        tickets?: SupportTicket[];
      }>(ENDPOINTS.support.tickets);
      return normalizeList<SupportTicket>(res, ['tickets']);
    },
    staleTime: 30_000,
  });
}
