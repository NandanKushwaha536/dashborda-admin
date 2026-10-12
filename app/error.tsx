'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/Feedback';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white">
        <ErrorState title="This page hit a problem" message="Reload to try again. If it keeps happening, tell the person who set up the admin." />
        <div className="flex justify-center gap-2 pb-8">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload page
          </Button>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  );
}
