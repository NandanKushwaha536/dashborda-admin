import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'RGEnterprises Business Admin',
  description:
    'Production-ready Next.js commercial business admin panel for RGEnterprises with authoritative backend sync, cookie-based session auth, and separated logistics control.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var reloadKey = 'chunk_reload_last_ts';
                function handleChunkFailure(msg) {
                  var text = String(msg || '');
                  if (
                    text.indexOf('ChunkLoadError') !== -1 ||
                    text.indexOf('Loading chunk') !== -1 ||
                    text.indexOf('failed to fetch dynamically imported module') !== -1 ||
                    text.indexOf('timeout') !== -1
                  ) {
                    var now = Date.now();
                    var last = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
                    if (now - last > 5000) {
                      sessionStorage.setItem(reloadKey, String(now));
                      window.location.reload();
                    }
                  }
                }
                window.addEventListener('error', function(e) {
                  if (e && e.target && e.target.tagName === 'SCRIPT') {
                    var src = String(e.target.src || '');
                    if (src.indexOf('/_next/static/chunks/') !== -1) {
                      handleChunkFailure('ChunkLoadError: ' + src);
                      return;
                    }
                  }
                  handleChunkFailure(e && (e.message || (e.error && e.error.message)));
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e && e.reason;
                  handleChunkFailure(reason && (reason.message || reason.toString()));
                });
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
