'use client';

import React from 'react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { PermissionGate } from '@/components/admin/auth/PermissionGate';
import { ShieldCheck, Lock, Key, Globe, CheckCircle, ExternalLink } from 'lucide-react';
import { getAppEnv } from '@/lib/env';

export default function SecurityPage() {
  const env = getAppEnv();

  return (
    <PermissionGate allowedRoles={['SUPER_ADMIN', 'ADMIN']} requiredPermission="manage:security">
      <div className="space-y-6">
        <AdminPageHeader
          title="Security & Access Governance"
          description="Session isolation, CSRF protection, and commercial authentication hardening."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminCard>
            <AdminCardHeader
              title="Cookie-Based Authentication Architecture"
              action={<ShieldCheck className="w-5 h-5 text-teal-600" />}
            />
            <AdminCardBody className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 bg-teal-50/60 border border-teal-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-teal-900">Zero Tokens in localStorage</span>
                  <p className="text-teal-700 mt-0.5">
                    All authentication tokens are transmitted in strict <code>httpOnly</code>,{' '}
                    <code>SameSite=Lax</code>, and <code>Secure</code> cookies, eliminating XSS token theft vectors.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <Lock className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">CSRF Token Guard</span>
                  <p className="text-slate-600 mt-0.5">
                    Every state-mutating request (POST, PUT, DELETE) includes an active{' '}
                    <code>X-CSRF-Token</code> header synced with the backend session secret with single-retry recovery.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <Key className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Server-Side Next.js Ingress Proxy</span>
                  <p className="text-slate-600 mt-0.5">
                    Requests route through <code>/api/backend/*</code> rewrites with strict security headers (CSP, HSTS, X-Frame-Options: DENY).
                  </p>
                </div>
              </div>
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader
              title="Separation of Logistics Control"
              action={<Globe className="w-5 h-5 text-blue-600" />}
            />
            <AdminCardBody className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Per enterprise specification, logistics operations (driver dispatch, AWB generation, return-to-origin processing) are managed exclusively in the <strong>RGEnterprises Logistics Control Center</strong>.
              </p>
              <p>
                This Business Admin control panel maintains read-only tracking synchronization and hands off dispatch operations to the dedicated logistics cluster, preventing operational duplication and privilege sprawl.
              </p>
              <div className="pt-2">
                {env.logisticsAppUrl ? (
                  <a
                    href={env.logisticsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <span>Inspect Logistics App Gateway</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                    <code>NEXT_PUBLIC_LOGISTICS_APP_URL</code> environment variable is not configured for this environment.
                  </div>
                )}
              </div>
            </AdminCardBody>
          </AdminCard>
        </div>
      </div>
    </PermissionGate>
  );
}
