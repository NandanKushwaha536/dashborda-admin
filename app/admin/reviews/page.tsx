'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Star } from 'lucide-react';
import { useReviews, useSetReviewStatus, type Review, type ReviewStatus } from '@/lib/hooks/useReviews';
import { useUrlParams } from '@/lib/hooks/useUrlState';
import { useAuth } from '@/lib/auth/AuthContext';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { REVIEW_STATUS } from '@/lib/status';
import { errorMessage, formatDate } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { Card, PageHeader } from '@/components/ui/Layout';
import { Pagination, Tabs } from '@/components/ui/Navigation';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal, useToast } from '@/components/ui/Overlay';

const PAGE_SIZE = 20;
type Filter = ReviewStatus | 'ALL';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={n <= rating ? 'h-4 w-4 fill-amber-400 text-amber-400' : 'h-4 w-4 text-slate-300'} aria-hidden="true" />
      ))}
    </span>
  );
}

function ReviewCard({ review, canWrite, onPhoto }: { review: Review; canWrite: boolean; onPhoto: (url: string) => void }) {
  const toast = useToast();
  const setStatus = useSetReviewStatus();
  const [pending, setPending] = useState<ReviewStatus | null>(null);

  const act = async (status: ReviewStatus) => {
    setPending(status);
    try {
      await setStatus.mutateAsync({ id: review.id, status });
      toast.success(status === 'APPROVED' ? 'Review published.' : 'Review rejected.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPending(null);
    }
  };

  return (
    <li className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 last:border-0 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Stars rating={review.rating} />
            <StatusBadge map={REVIEW_STATUS} value={review.status} />
            {review.isVerifiedPurchase ? (
              <span className="flex items-center gap-1 text-[12px] font-medium text-green-800">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Verified purchase
              </span>
            ) : null}
          </div>
          <span className="text-[13px] text-slate-600">
            {review.customerName} on{' '}
            <Link href={`/admin/products/${review.productId}`} className="font-medium text-indigo-700 hover:underline">
              {review.productName}
            </Link>{' '}
            · {formatDate(review.createdAt)}
          </span>
        </div>
        {canWrite ? (
          <div className="flex w-full gap-2 sm:w-auto">
            {review.status !== 'REJECTED' ? (
              <Button size="sm" variant="ghost" className="flex-1 text-red-700 hover:bg-red-50 sm:flex-none" loading={pending === 'REJECTED'} onClick={() => act('REJECTED')}>
                Reject
              </Button>
            ) : null}
            {review.status !== 'APPROVED' ? (
              <Button size="sm" className="flex-1 sm:flex-none" loading={pending === 'APPROVED'} onClick={() => act('APPROVED')}>
                Publish
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {review.title ? <p className="font-semibold text-slate-900">{review.title}</p> : null}
      {review.comment ? <p className="whitespace-pre-line text-sm text-slate-700">{review.comment}</p> : null}
      {review.images.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {review.images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => onPhoto(url)}
              aria-label={`Open customer photo ${index + 1}`}
              className="h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL */}
              <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </li>
  );
}

function ReviewsView() {
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.REVIEWS_WRITE);
  const [query, setQuery] = useUrlParams(['status', 'page'] as const);
  const filter = (query.status || 'PENDING') as Filter;
  const page = Math.max(1, Number(query.page) || 1);
  const [photo, setPhoto] = useState<string | null>(null);
  const reviews = useReviews({ status: filter === 'ALL' ? '' : filter, page, limit: PAGE_SIZE });
  const rows = reviews.data?.reviews ?? [];

  return (
    <>
      <PageHeader
        title="Reviews"
        description="New reviews wait here until you publish them. Only published reviews show on the store."
      />
      <Card className="overflow-hidden">
        <div className="pt-3 md:pt-0">
          <Tabs<Filter>
            label="Review status"
            value={filter}
            onChange={(value) => setQuery({ status: value === 'PENDING' ? null : value, page: null })}
            items={[
              { value: 'PENDING', label: 'Waiting' },
              { value: 'APPROVED', label: 'Published' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'ALL', label: 'All' },
            ]}
          />
        </div>
        {reviews.isLoading ? (
          <ListSkeleton />
        ) : reviews.error ? (
          <ErrorState message={errorMessage(reviews.error)} onRetry={() => reviews.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title={filter === 'PENDING' ? 'No reviews waiting' : 'No reviews here'} description={filter === 'PENDING' ? 'You are all caught up.' : undefined} />
        ) : (
          <ul aria-label="Reviews">
            {rows.map((review) => (
              <ReviewCard key={review.id} review={review} canWrite={canWrite} onPhoto={setPhoto} />
            ))}
          </ul>
        )}
        {reviews.data && reviews.data.total > PAGE_SIZE ? (
          <Pagination page={page} pageSize={PAGE_SIZE} total={reviews.data.total} onPageChange={(next) => setQuery({ page: next })} />
        ) : null}
      </Card>
      <Modal open={photo !== null} onClose={() => setPhoto(null)} title="Customer photo" size="lg">
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL */}
        {photo ? <img src={photo} alt="Customer photo" className="mx-auto max-h-[70vh] w-auto rounded-lg" /> : null}
      </Modal>
    </>
  );
}

export default function ReviewsPage() {
  return (
    <Restricted permission={PERMISSIONS.REVIEWS_READ}>
      <Suspense fallback={null}>
        <ReviewsView />
      </Suspense>
    </Restricted>
  );
}
