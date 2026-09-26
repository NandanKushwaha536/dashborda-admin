import { Suspense } from 'react';
import { DevToolsShell } from '@/components/admin/devtools/DevToolsShell';

export const metadata = {
  title: 'Developer Tools | RGEnterprises Admin',
  description: 'Technical control center, API explorer, and backend subsystem diagnostics for RGEnterprises engineering.',
};

export default function DevToolsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center font-mono text-xs text-slate-500">
          Initializing RGEnterprises Developer Tools...
        </div>
      }
    >
      <DevToolsShell />
    </Suspense>
  );
}
