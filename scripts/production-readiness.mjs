import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('Running production readiness audit...');

const baseDir = process.cwd();

// Check 1: Security headers in next.config.ts
const nextConfigPath = resolve(baseDir, 'next.config.ts');
if (existsSync(nextConfigPath)) {
  const content = readFileSync(nextConfigPath, 'utf-8');
  if (content.includes('X-Content-Type-Options') && content.includes('X-Frame-Options')) {
    console.log('Check 1: Security headers - PASS');
  } else {
    console.error('Check 1: Security headers - FAIL');
    process.exit(1);
  }
} else {
  console.error('Check 1: next.config.ts missing - FAIL');
  process.exit(1);
}

// Check 2: Clean API routes and centralized client
const clientPath = resolve(baseDir, 'lib/api/client.ts');
const endpointsPath = resolve(baseDir, 'lib/api/endpoints.ts');
if (existsSync(clientPath) && existsSync(endpointsPath)) {
  console.log('Check 2: Centralized API client & endpoints - PASS');
} else {
  console.error('Check 2: Centralized API client missing - FAIL');
  process.exit(1);
}

// Check 3: Environment configuration
const envExamplePath = resolve(baseDir, '.env.example');
if (existsSync(envExamplePath)) {
  const envContent = readFileSync(envExamplePath, 'utf-8');
  if (envContent.includes('BACKEND_API_URL') && envContent.includes('NEXT_PUBLIC_API_BASE_URL')) {
    console.log('Check 3: Environment configuration - PASS');
  } else {
    console.error('Check 3: Environment configuration invalid - FAIL');
    process.exit(1);
  }
} else {
  console.error('Check 3: .env.example missing - FAIL');
  process.exit(1);
}

// Check 4: No forbidden mocks in production code
const filesToCheck = [
  'app/admin/orders/page.tsx',
  'app/admin/products/page.tsx',
  'app/admin/inventory/page.tsx',
  'app/admin/customers/page.tsx',
  'app/admin/finance/page.tsx',
];

let mockFound = false;
for (const file of filesToCheck) {
  const fullPath = resolve(baseDir, file);
  if (existsSync(fullPath)) {
    const fileContent = readFileSync(fullPath, 'utf-8');
    if (fileContent.includes('INITIAL_') || fileContent.includes('mockData')) {
      console.error(`Check 4: Forbidden mock data detected in ${file} - FAIL`);
      mockFound = true;
    }
  }
}

if (mockFound) {
  process.exit(1);
} else {
  console.log('Check 4: Zero mock imports / initialData constants in production code - PASS');
}

console.log('Production readiness audit PASSED.');
