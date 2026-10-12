'use client';

import { useParams } from 'next/navigation';
import { useProduct } from '@/lib/hooks/useProducts';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { PRODUCT_STATUS } from '@/lib/status';
import { errorMessage } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { PageHeader } from '@/components/ui/Layout';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProductForm } from '@/components/products/ProductForm';

function EditProduct({ id }: { id: string }) {
  const { data: product, isLoading, error, refetch } = useProduct(id);
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (error || !product) return <ErrorState title="Could not load this product" message={errorMessage(error, 'Product not found.')} onRetry={() => refetch()} />;
  return (
    <>
      <PageHeader
        title={product.name}
        badge={<StatusBadge map={PRODUCT_STATUS} value={product.status} />}
        description={`SKU ${product.sku}`}
      />
      {/* key resets the form when another product is opened */}
      <ProductForm key={product._id} product={product} />
    </>
  );
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  return (
    <Restricted permission={PERMISSIONS.PRODUCTS_WRITE}>
      <EditProduct id={params.id} />
    </Restricted>
  );
}
