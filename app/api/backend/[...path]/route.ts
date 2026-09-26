import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_BACKEND_API_URL = 'https://urbannest-backend-5u5q.onrender.com/api/v1';

function getBackendBaseUrl(): string {
  const configured = process.env.BACKEND_API_URL?.trim();
  let base = (configured || DEFAULT_BACKEND_API_URL).replace(/\/+$/, '');

  // If configured URL is missing the /api/v1 prefix (e.g. host-only URL), append it
  if (!base.endsWith('/api/v1') && !base.endsWith('/api')) {
    base = `${base}/api/v1`;
  }
  return base;
}

function buildUpstreamUrl(pathSegments: string[], search: string): string {
  const base = getBackendBaseUrl();
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
  ];

  for (const name of forwardHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

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
  const upstreamUrl = buildUpstreamUrl(pathSegments, request.nextUrl.search);

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
