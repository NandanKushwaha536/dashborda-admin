'use client';

// Last-resort screen when the root layout itself fails; it must render its own <html> and <body>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f8fafc', margin: 0 }}>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 18, color: '#0f172a', marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Please reload the page. If it keeps happening, try again in a few minutes.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={reset} style={{ padding: '10px 18px', borderRadius: 10, border: 0, background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Try again
            </button>
            <button type="button" onClick={() => window.location.reload()} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
