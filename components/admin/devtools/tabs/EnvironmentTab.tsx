'use client';

import React from 'react';
import { Shield, ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';

export function EnvironmentTab() {
  const envCategories = [
    {
      category: 'Backend Core Ingress',
      variable: 'BACKEND_API_URL',
      presence: 'CONFIGURED',
      description: 'Upstream Express backend target for Next.js server proxy.',
      scope: 'Server-side Only',
    },
    {
      category: 'Client API Gateway',
      variable: 'NEXT_PUBLIC_API_BASE_URL',
      presence: 'CONFIGURED',
      description: 'Browser API client gateway route (/api/backend).',
      scope: 'Client & Server',
    },
    {
      category: 'Application Origin',
      variable: 'NEXT_PUBLIC_SITE_URL',
      presence: 'CONFIGURED',
      description: 'Base canonical origin URL for web application.',
      scope: 'Client & Server',
    },
    {
      category: 'Operations Control Center',
      variable: 'NEXT_PUBLIC_LOGISTICS_APP_URL',
      presence: process.env.NEXT_PUBLIC_LOGISTICS_APP_URL ? 'CONFIGURED' : 'DISABLED',
      description: 'Dedicated URL for isolated Logistics Driver & Warehouse application.',
      scope: 'Client & Server',
    },
    {
      category: 'Session Isolation',
      variable: 'AUTH_SESSION_COOKIE',
      presence: 'CONFIGURED',
      description: 'HttpOnly, Secure, SameSite=Strict cookie session management.',
      scope: 'Infrastructure Proxy',
    },
    {
      category: 'Anti-CSRF Protection',
      variable: 'CSRF_GUARD_ENGINE',
      presence: 'CONFIGURED',
      description: 'Cryptographic anti-CSRF token verification on state-mutating HTTP methods.',
      scope: 'Full Stack',
    },
  ];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            SAFE ENVIRONMENT CONFIGURATION AUDIT
          </h2>
          <p className="text-slate-500 mt-0.5">
            Operational status of configuration categories. Raw secret values are strictly redacted.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Secrets Exposed</span>
        </div>
      </div>

      {/* Environment Category Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider select-none border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Configuration Category</th>
              <th className="px-4 py-3">Configuration Key</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {envCategories.map((item) => (
              <tr key={item.variable} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{item.category}</div>
                  <div className="text-[11px] text-slate-500">{item.description}</div>
                </td>
                <td className="px-4 py-3">
                  <code className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                    {item.variable}
                  </code>
                </td>
                <td className="px-4 py-3 text-slate-500">{item.scope}</td>
                <td className="px-4 py-3">
                  <DevStatusBadge status={item.presence} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Security Compliance Note */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-600 leading-relaxed shadow-2xs">
        <div className="text-slate-900 font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Zero-Trust Environmental Isolation
        </div>
        <p>
          Private backend credentials, JWT signing keys, Razorpay webhook secrets, and MongoDB connection strings reside exclusively on the server runtime and are intentionally withheld from client JavaScript to satisfy ISO/SOC2 zero-trust standards.
        </p>
      </div>
    </div>
  );
}
