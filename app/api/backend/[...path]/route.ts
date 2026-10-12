import { NextRequest, NextResponse } from 'next/server';

/** Backend base URL from BACKEND_API_URL; there is deliberately no built-in default. */
function getBackendBaseUrl(): string | null {
  const configured = process.env.BACKEND_API_URL?.trim();
  if (!configured) return null;
  let base = configured.replace(/\/+$/, '');

  // If configured URL is missing the /api/v1 prefix (e.g. host-only URL), append it
  if (!base.endsWith('/api/v1') && !base.endsWith('/api')) {
    base = `${base}/api/v1`;
  }
  return base;
}

function buildUpstreamUrl(base: string, pathSegments: string[], search: string): string {
  let segments = [...pathSegments];

  // Deduplicate /api/v1 or /api if already in base URL
  if (base.endsWith('/api/v1')) {
    if (segments[0] === 'api' && segments[1] === 'v1') {
      segments = segments.slice(2);
    } else if (segments[0] === 'api') {
      segments = segments.slice(1);
    }
  } else if (base.endsWith('/api')) {
    if (segments[0] === 'api') {
      segments = segments.slice(1);
    }
  }

  const path = segments.join('/');
  return `${base}/${path}${search}`;
}

/**
 * Tells the backend who the real visitor is, so its rate limits are counted
 * per customer and not per website server. The backend believes the address
 * only because the shared secret travels with it (PROXY_SHARED_SECRET, the
 * same value on the backend). Anything the browser sent under these names is
 * ignored: only the hosting platform's own headers are read.
 */
function visitorAddress(request: NextRequest): string | undefined {
  const candidates = [
    request.headers.get('x-real-ip'),
    request.headers.get('x-vercel-forwarded-for'),
    request.headers.get('cf-connecting-ip'),
    request.headers.get('x-forwarded-for'),
  ];
  for (const candidate of candidates) {
    const first = candidate?.split(',')[0]?.trim();
    if (first && first.length <= 64 && /^[0-9a-fA-F:.]+$/.test(first)) return first;
  }
  return undefined;
}

function addVisitorIdentity(request: NextRequest, headers: Headers): void {
  const secret = process.env.PROXY_SHARED_SECRET?.trim();
  if (!secret) return;
  const address = visitorAddress(request);
  // Without an address the backend would treat this as the website server
  // itself (unlimited), so the secret is only sent together with one.
  if (!address) return;
  headers.set('x-rg-proxy-secret', secret);
  headers.set('x-rg-client-ip', address);
}

const RATE_LIMIT_RESPONSE_HEADERS = ['retry-after', 'ratelimit', 'ratelimit-policy'];

function copyRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  const forwardHeaders = [
    'accept',
    'authorization',
    'content-type',
    'cookie',
    'origin',
    'referer',
    'user-agent',
    'x-csrf-token',
    'x-request-id',
    'idempotency-key',
    'x-idempotency-key',
    // Password re-check token for sensitive actions (refunds, stock, staff).
    'x-step-up-token',
  ];

  for (const name of forwardHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  addVisitorIdentity(request, headers);

  return headers;
}

function appendSetCookies(response: NextResponse, upstream: Response): void {
  const upstreamHeaders = upstream.headers as Headers & {
    getSetCookie?: () => string[];
  };

  const cookies = upstreamHeaders.getSetCookie?.() ?? [];

  for (const cookie of cookies) {
    // The upstream service belongs to Render, while the browser talks to the
    // Business Admin origin. Remove an upstream Domain attribute so the browser
    // can store the session cookie for the Business Admin origin.
    const normalizedCookie = cookie.replace(/;\s*Domain=[^;]*/gi, '');
    response.headers.append('set-cookie', normalizedCookie);
  }
}

async function proxy(request: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const base = getBackendBaseUrl();
  if (!base) {
    console.error('[Backend Proxy] BACKEND_API_URL is not set');
    return NextResponse.json(
      { success: false, message: 'The admin is not connected to a backend yet. Set BACKEND_API_URL and redeploy.' },
      { status: 503 }
    );
  }
  const upstreamUrl = buildUpstreamUrl(base, pathSegments, request.nextUrl.search);

  let body: ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.arrayBuffer();
  }

  let upstream: Response;

  try {
    upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: copyRequestHeaders(request),
      body,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch (error: unknown) {
    const code =
      error instanceof Error && 'cause' in error && error.cause instanceof Error
        ? error.cause.message
        : error instanceof Error
          ? error.message
          : 'Unknown upstream connection error';

    console.error('[Backend Proxy] Upstream request failed', {
      method: request.method,
      path: request.nextUrl.pathname,
      upstreamUrl,
      error: code,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'BACKEND_CONNECTION_ERROR',
        message: 'The backend service could not be reached. Please try again shortly.',
      },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();

  const contentType = upstream.headers.get('content-type');
  if (contentType) responseHeaders.set('content-type', contentType);

  const contentDisposition = upstream.headers.get('content-disposition');
  if (contentDisposition) responseHeaders.set('content-disposition', contentDisposition);

  const cacheControl = upstream.headers.get('cache-control');
  if (cacheControl) responseHeaders.set('cache-control', cacheControl);

  for (const name of RATE_LIMIT_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });

  appendSetCookies(response, upstream);

  return response;
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function HEAD(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}
