'use client';

import React from 'react';
import { Flag, AlertCircle, ShieldAlert } from 'lucide-react';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';

export function FeatureFlagsTab() {
  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Flag className="w-4 h-4 text-blue-600" />
            DYNAMIC FEATURE FLAGS & TOGGLE CONTROLS
          </h2>
          <p className="text-slate-500 mt-0.5">
            Runtime feature toggling, progressive rollouts, and kill-switches.
          </p>
        </div>

        <DevStatusBadge status="NOT_IMPLEMENTED" />
      </div>

      {/* Backend Status Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-start gap-3 shadow-2xs">
        <AlertCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-2 leading-relaxed">
          <div className="font-semibold text-slate-800">
            Not available — backend endpoint not implemented.
          </div>
          <p className="text-slate-600">
            No backend feature flag service detected. The RGEnterprises backend service does not currently provide an endpoint (e.g. <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200 font-medium">/admin/feature-flags</code>) for remote configuration toggling.
          </p>
          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded flex items-center gap-2 text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong className="text-amber-800 font-semibold">Security Rule:</strong> Client-side or frontend-only feature flag overrides are strictly forbidden to ensure production safety and authoritative backend privilege enforcement.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
