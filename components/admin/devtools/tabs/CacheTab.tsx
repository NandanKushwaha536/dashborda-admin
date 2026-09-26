'use client';

import React, { useState } from 'react';
import { Zap, AlertCircle, Trash2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';
import { DevConfirmModal } from '@/components/admin/devtools/DevConfirmModal';

export function CacheTab() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleClearCache = async () => {
    // Attempt backend cache purge if endpoint exists
    try {
      const res = await fetch('/api/backend/admin/cache', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.status === 404) {
        throw new Error('Backend cache purge endpoint (/admin/cache) is not implemented.');
      }
      setActionFeedback('Cache purged successfully.');
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            APPLICATION CACHE & INVALIDATION DIAGNOSTICS
          </h2>
          <p className="text-slate-500 mt-0.5">
            TTL policies, cache hit-rate telemetry, and selective key invalidation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Purge All Cache</span>
        </button>
      </div>

      {/* Backend Status Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-start gap-3 shadow-2xs">
        <AlertCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5 leading-relaxed">
          <div className="font-semibold text-slate-800">
            Not available — backend cache diagnostics endpoint not implemented.
          </div>
          <p className="text-slate-600">
            The RGEnterprises Express backend utilizes in-memory or Redis key-value caching on select read paths, but does not currently expose an HTTP administration endpoint (e.g. <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200 font-medium">/admin/cache</code>) for cache introspection or remote key invalidation.
          </p>
        </div>
      </div>

      {/* Cache Policies Breakdown */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
          DOCUMENTED CACHE TTL POLICIES IN BACKEND
        </div>

        <div className="divide-y divide-slate-100">
          <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div>
              <div className="font-semibold text-slate-900">Product Categories & Taxonomy</div>
              <div className="text-slate-500 text-[11px]">Static category trees and brand hierarchies</div>
            </div>
            <span className="text-blue-600 font-bold">TTL: 3600s (1 Hour)</span>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div>
              <div className="font-semibold text-slate-900">Storefront Product Details</div>
              <div className="text-slate-500 text-[11px]">Read queries for catalog product specifications</div>
            </div>
            <span className="text-blue-600 font-bold">TTL: 300s (5 Mins)</span>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div>
              <div className="font-semibold text-slate-900">Customer Cart Stock Reservations</div>
              <div className="text-slate-500 text-[11px]">Temporary inventory quantity locks during checkout</div>
            </div>
            <span className="text-amber-600 font-bold">TTL: 900s (15 Mins)</span>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div>
              <div className="font-semibold text-slate-900">Commercial Orders & Financial Ledgers</div>
              <div className="text-slate-500 text-[11px]">Transactional ledger mutations and real-time orders</div>
            </div>
            <span className="text-emerald-700 font-bold">NO CACHE (Real-time ACID)</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <DevConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleClearCache}
        title="Purge Application Cache"
        description="This will issue a cache invalidation request to flush all cached catalog documents and session caches across the backend. This may cause a temporary spike in database query latency."
        actionButtonText="Purge Cache"
        requiredConfirmationText="PURGE_CACHE"
      />
    </div>
  );
}
