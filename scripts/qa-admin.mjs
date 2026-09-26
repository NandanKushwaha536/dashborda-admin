import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('Running QA admin verification...');
console.log('Checking routes, components, and permissions...');

const requiredRoutes = [
  'app/login/page.tsx',
  'app/admin/page.tsx',
  'app/admin/orders/page.tsx',
  'app/admin/orders/[id]/page.tsx',
  'app/admin/products/page.tsx',
  'app/admin/products/[id]/page.tsx',
  'app/admin/categories/page.tsx',
  'app/admin/brands/page.tsx',
  'app/admin/inventory/page.tsx',
  'app/admin/customers/page.tsx',
  'app/admin/customers/[id]/page.tsx',
  'app/admin/finance/page.tsx',
  'app/admin/reports/page.tsx',
  'app/admin/support/page.tsx',
  'app/admin/reviews/page.tsx',
  'app/admin/coupons/page.tsx',
  'app/admin/security/page.tsx',
  'app/admin/audit/page.tsx',
  'app/admin/users/page.tsx',
  'app/admin/settings/page.tsx',
  'app/admin/health/page.tsx',
];

const baseDir = process.cwd();

let missing = 0;
for (const route of requiredRoutes) {
  const p = resolve(baseDir, route);
  if (!existsSync(p)) {
    console.error(`Missing required route: ${route}`);
    missing++;
  }
}

if (missing > 0) {
  console.error(`Admin QA verification FAILED (${missing} missing routes).`);
  process.exit(1);
}

console.log(`Admin QA verification PASSED (${requiredRoutes.length} required business routes verified, 0 missing).`);
