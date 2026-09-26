'use client';

import React from 'react';
import { useSupportTickets, SupportTicket } from '@/lib/hooks/useSupport';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { LifeBuoy } from 'lucide-react';

export default function SupportPage() {
  const { data: ticketsData, isLoading, error, refetch } = useSupportTickets();
  const tickets = Array.isArray(ticketsData) ? ticketsData : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Support Desk"
        description="Track customer inquiries, return claims, and order dispute resolutions."
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <AdminTableSkeleton rows={5} columns={7} />
        ) : error ? (
          <div className="py-12">
            <AdminErrorState
              title="Failed to load support tickets"
              message="Could not retrieve support tickets from backend."
              onRetry={() => refetch()}
            />
          </div>
        ) : tickets.length === 0 ? (
          <AdminEmptyState
            icon={<LifeBuoy className="w-8 h-8" />}
            title="No support tickets pending"
            description="Zero customer inquiries or open dispute claims in the queue."
          />
        ) : (
          <AdminTable
            headers={[
              'Ticket #',
              'Customer',
              'Subject',
              'Associated Order',
              'Priority',
              'Status',
              'Date',
            ]}
          >
            {tickets.map((t: SupportTicket) => (
              <AdminTableRow key={t.id}>
                <AdminTableCell className="font-mono text-xs font-semibold text-blue-600">
                  {t.ticketNumber}
                </AdminTableCell>

                <AdminTableCell className="font-medium text-slate-900 text-xs">
                  {t.customerName}
                </AdminTableCell>

                <AdminTableCell className="text-xs text-slate-700">
                  {t.subject}
                </AdminTableCell>

                <AdminTableCell className="text-xs font-mono text-slate-500">
                  {t.orderNumber || '—'}
                </AdminTableCell>

                <AdminTableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                      t.priority === 'URGENT'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : t.priority === 'HIGH'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-50 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {t.priority}
                  </span>
                </AdminTableCell>

                <AdminTableCell>
                  <AdminStatusBadge status={t.status} size="sm" />
                </AdminTableCell>

                <AdminTableCell className="text-xs text-slate-400">
                  {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </div>
    </div>
  );
}
