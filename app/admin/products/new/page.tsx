'use client';

import { PERMISSIONS } from '@/lib/auth/permissions';
import { Restricted } from '@/components/shell/Restricted';
import { PageHeader } from '@/components/ui/Layout';
import { ProductForm } from '@/components/products/ProductForm';

export default function NewProductPage() {
  return (
    <Restricted permission={PERMISSIONS.PRODUCTS_WRITE}>
      <PageHeader
        title="Add product"
        description="Fields marked * are needed before the product can be saved."
      />
      <ProductForm product={null} />
    </Restricted>
  );
}
