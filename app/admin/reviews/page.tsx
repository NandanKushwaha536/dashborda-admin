'use client';

import React from 'react';
import { useReviews, useUpdateReviewStatus, ReviewItem } from '@/lib/hooks/useReviews';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { Star, CheckCircle, XCircle } from 'lucide-react';

export default function ReviewsPage() {
  const { data: reviewsData, isLoading, error, refetch } = useReviews();
  const reviews = Array.isArray(reviewsData) ? reviewsData : [];
  const updateStatusMutation = useUpdateReviewStatus();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Product Reviews & Ratings"
        description="Moderate customer testimonials, feedback ratings, and storefront visibility."
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <AdminTableSkeleton rows={5} columns={7} />
        ) : error ? (
          <div className="py-12">
            <AdminErrorState
              title="Failed to load product reviews"
              message="Could not retrieve review moderation stream from backend."
              onRetry={() => refetch()}
            />
          </div>
        ) : reviews.length === 0 ? (
          <AdminEmptyState
            icon={<Star className="w-8 h-8" />}
            title="No product reviews"
            description="Zero user-submitted reviews pending or published in the database."
          />
        ) : (
          <AdminTable
            headers={[
              'Product',
              'Reviewer',
              'Rating',
              'Feedback Comment',
              'Date',
              'Moderation State',
              'Actions',
            ]}
          >
            {reviews.map((r: ReviewItem) => (
              <AdminTableRow key={r.id}>
                <AdminTableCell className="font-semibold text-slate-900 text-xs">
                  {r.productName}
                </AdminTableCell>

                <AdminTableCell className="text-xs text-slate-700">
                  {r.customerName}
                </AdminTableCell>

                <AdminTableCell>
                  <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                    <span>★</span>
                    <span>{r.rating}/5</span>
                  </div>
                </AdminTableCell>

                <AdminTableCell className="text-xs text-slate-600 max-w-xs truncate">
                  {r.comment}
                </AdminTableCell>

                <AdminTableCell className="text-xs text-slate-400">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                </AdminTableCell>

                <AdminTableCell>
                  <AdminStatusBadge status={r.status} size="sm" />
                </AdminTableCell>

                <AdminTableCell>
                  <div className="flex items-center gap-1">
                    {r.status !== 'APPROVED' && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({ id: r.id, status: 'APPROVED' })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                        title="Approve Review"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {r.status !== 'REJECTED' && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({ id: r.id, status: 'REJECTED' })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Reject Review"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </div>
    </div>
  );
}
