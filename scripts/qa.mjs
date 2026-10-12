// Static release checks for the admin. Prints PASS only for what it actually checked.
// Usage: node scripts/qa.mjs   (exit code 1 on any failure)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = process.cwd();
let failures = 0;
const pass = (message) => console.log(`PASS  ${message}`);
const fail = (message) => {
  failures += 1;
  console.error(`FAIL  ${message}`);
};

// 1. Every page the navigation links to exists.
const pages = [
  'app/login/page.tsx',
  'app/admin/page.tsx',
  'app/admin/orders/page.tsx',
  'app/admin/orders/[id]/page.tsx',
  'app/admin/returns/page.tsx',
  'app/admin/products/page.tsx',
  'app/admin/products/new/page.tsx',
  'app/admin/products/[id]/page.tsx',
  'app/admin/categories/page.tsx',
  'app/admin/brands/page.tsx',
  'app/admin/inventory/page.tsx',
  'app/admin/customers/page.tsx',
  'app/admin/customers/[id]/page.tsx',
  'app/admin/reviews/page.tsx',
  'app/admin/coupons/page.tsx',
  'app/admin/reports/page.tsx',
  'app/admin/settings/page.tsx',
  'app/admin/team/page.tsx',
  'app/admin/profile/page.tsx',
  'app/admin/developer/page.tsx',
  'app/print/orders/page.tsx',
];
const missing = pages.filter((page) => !existsSync(resolve(root, page)));
missing.length ? missing.forEach((page) => fail(`missing page ${page}`)) : pass(`${pages.length} pages present`);

// 2. Navigation hrefs all point at existing pages.
const nav = readFileSync(resolve(root, 'lib/navigation.ts'), 'utf8');
const hrefs = [...nav.matchAll(/href: '([^']+)'/g)].map((m) => m[1]);
const badHrefs = hrefs.filter((href) => !existsSync(resolve(root, `app${href}/page.tsx`)));
badHrefs.length ? badHrefs.forEach((href) => fail(`navigation link without a page: ${href}`)) : pass(`${hrefs.length} navigation links resolve`);

// 3. Security headers.
const nextConfig = readFileSync(resolve(root, 'next.config.ts'), 'utf8');
['X-Content-Type-Options', 'X-Frame-Options', 'Strict-Transport-Security', 'X-Robots-Tag'].every((h) => nextConfig.includes(h))
  ? pass('security headers configured')
  : fail('next.config.ts is missing a security header');

// 4. Environment template documents the variables the proxy reads.
const env = existsSync(resolve(root, '.env.example')) ? readFileSync(resolve(root, '.env.example'), 'utf8') : '';
['BACKEND_API_URL', 'PROXY_SHARED_SECRET'].every((v) => env.includes(v)) ? pass('.env.example lists BACKEND_API_URL and PROXY_SHARED_SECRET') : fail('.env.example is missing BACKEND_API_URL or PROXY_SHARED_SECRET');

// 5. No placeholder or sample data in shipped code.
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}
const sources = ['app', 'components', 'lib'].flatMap((dir) => walk(resolve(root, dir)));
const forbidden = /\b(mockData|dummyData|sampleData|lorem ipsum|faker|INITIAL_[A-Z_]+)\b/i;
const offenders = sources.filter((file) => forbidden.test(readFileSync(file, 'utf8')));
offenders.length ? offenders.forEach((file) => fail(`sample/mock data in ${file.replace(`${root}/`, '')}`)) : pass(`no mock or sample data in ${sources.length} source files`);

// 6. API paths live only in lib/api/endpoints.ts (no hard-coded backend paths in pages).
const pathPattern = /api\.(get|post|put|patch|delete)<[^>]*>\(\s*['`]\//;
const hardCoded = sources.filter((file) => pathPattern.test(readFileSync(file, 'utf8')));
hardCoded.length ? hardCoded.forEach((file) => fail(`hard-coded API path in ${file.replace(`${root}/`, '')}`)) : pass('all API paths come from lib/api/endpoints.ts');

if (failures) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll static checks passed. Live behaviour still needs a run against a staging backend (scripts/live-api-smoke.mjs).');
