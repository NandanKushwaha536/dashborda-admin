'use client';

import React, { useEffect } from 'react';

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Automatically recover from chunk load errors caused by deployments or stale chunk caches
    const message = error?.message || '';
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      message.includes('ChunkLoadError') ||
      message.includes('Loading chunk') ||
      message.includes('failed to fetch dynamically imported module') ||
      message.includes('timeout');

    if (isChunkError && typeof window !== 'undefined') {
      const lastReload = sessionStorage.getItem('chunk_load_last_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 4000) {
        sessionStorage.setItem('chunk_load_last_reload', now.toString());
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-base font-bold text-slate-900">Application Update Detected</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The application has been updated or refreshed. Click below to reload and sync the latest workspace state.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reload Page
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
