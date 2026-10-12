/**
 * Read-only smoke test for the live backend.
 * Usage (from the admin folder, Node 18+):
 *   set API_BASE=https://<your-backend>/api/v1   (Windows PowerShell: $env:API_BASE="...")
 *   node scripts/live-api-smoke.mjs
 * Only sends GET requests to public endpoints. Writes nothing.
 */
if (!process.env.API_BASE) {
  console.error('Set API_BASE to your backend URL, e.g. https://<your-backend>/api/v1');
  process.exit(1);
}
const BASE = process.env.API_BASE.replace(/\/$/, '');
const TIMEOUT_MS = 20000;

const checks = [
  { name: 'Products list', path: '/products?limit=5' },
  { name: 'Product search', path: '/products/search?q=shoe' },
  { name: 'Categories', path: '/categories' },
  { name: 'Brands', path: '/brands' },
  { name: 'Public coupons', path: '/coupons/public' },
];

async function run(check) {
  const started = Date.now();
  try {
    const res = await fetch(BASE + check.path, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ms = Date.now() - started;
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not JSON */ }
    const ok = res.ok && json !== null;
    const count = Array.isArray(json) ? json.length
      : Array.isArray(json?.data) ? json.data.length
      : Array.isArray(json?.items) ? json.items.length
      : null;
    return { ...check, status: res.status, ms, ok, count, note: ok ? '' : `not JSON or HTTP ${res.status}: ${text.slice(0, 120)}` };
  } catch (err) {
    return { ...check, status: 'ERR', ms: Date.now() - started, ok: false, count: null, note: err.message };
  }
}

console.log(`Live API smoke test -> ${BASE}\n`);
let failed = 0;
for (const check of checks) {
  const r = await run(check);
  if (!r.ok) failed += 1;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(18)} HTTP ${String(r.status).padEnd(4)} ${String(r.ms).padStart(5)}ms  items=${r.count ?? '-'}  ${r.note}`);
}
console.log(`\n${checks.length - failed}/${checks.length} passed.`);
process.exit(failed ? 1 : 0);
