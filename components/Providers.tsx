'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ToastProvider } from '@/components/ui/Overlay';
import { ApiError } from '@/lib/api/client';

const CHUNK_RELOAD_KEY = 'rg:chunk-reload-at';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            // Don't retry requests the backend refused on purpose.
            retry: (failureCount, error) =>
              !(error instanceof ApiError && [400, 401, 403, 404].includes(error.status)) && failureCount < 1,
          },
        },
      })
  );

  // After a new deploy, an open tab can ask for old code files that no longer
  // exist. Reload once so the admin picks up the new version.
  useEffect(() => {
    const onError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'reason' in event ? event.reason : event.error;
      const message = String(error?.message ?? ('message' in event ? event.message : '') ?? '');
      if (error?.name !== 'ChunkLoadError' && !message.includes('Loading chunk')) return;
      try {
        const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);
        if (Date.now() - last < 10_000) return;
        sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
      } catch {
        // Storage unavailable: still reload once.
      }
      window.location.reload();
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onError);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onError);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
