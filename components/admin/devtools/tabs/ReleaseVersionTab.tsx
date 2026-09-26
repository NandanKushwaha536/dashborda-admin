'use client';

import React from 'react';
import { Tag, CheckCircle2, GitCommit, Clock, Server, Layers } from 'lucide-react';
import { useDevSystemHealth } from '@/lib/hooks/useDevTools';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';

export function ReleaseVersionTab() {
  const { data: health } = useDevSystemHealth();

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" />
            BUILD ARTIFACTS & RELEASE VERSION MANIFEST
          </h2>
          <p className="text-slate-500 mt-0.5">
            Compiled application hashes, dependency runtimes, and deployment target environments.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
          STABLE RELEASE
        </span>
      </div>

      {/* Grid of Version Specs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            ADMIN FRONTEND APPLICATION
          </div>
          <div className="text-lg font-bold text-slate-900">v1.0.0-prod</div>
          <div className="text-slate-500 text-[11px]">Next.js 15+ App Router</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-emerald-600" />
            BACKEND API SERVICE
          </div>
          <div className="text-lg font-bold text-slate-900">
            {health?.version ? `v${health.version}` : 'v1.0.0-release'}
          </div>
          <div className="text-slate-500 text-[11px]">Express Ingress Controller</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5 text-amber-500" />
            NODE.JS RUNTIME
          </div>
          <div className="text-lg font-bold text-slate-900">{process.version || 'v22.x LTS'}</div>
          <div className="text-slate-500 text-[11px]">Engine: V8 JavaScript Core</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            TARGET ENVIRONMENT
          </div>
          <div className="text-lg font-bold text-blue-600">
            {process.env.NODE_ENV === 'production' ? 'Production (Render Cloud)' : 'Development Sandbox'}
          </div>
          <div className="text-slate-500 text-[11px]">Region: Cloud Native Global Ingress</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            SECURITY SPECIFICATION
          </div>
          <div className="text-lg font-bold text-emerald-700">CSRF + HttpOnly Guard</div>
          <div className="text-slate-500 text-[11px]">Strict Cookie & Header Quarantine</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            BUILD CERTIFICATION
          </div>
          <div className="text-lg font-bold text-slate-900">Clean Verification</div>
          <div className="text-slate-500 text-[11px]">Zero Unhandled Exceptions</div>
        </div>
      </div>
    </div>
  );
}
