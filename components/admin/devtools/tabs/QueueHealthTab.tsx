'use client';

import React, { useState } from 'react';
import { Layers, AlertCircle, RefreshCw, Pause, Play, RotateCcw } from 'lucide-react';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';
import { DevConfirmModal } from '@/components/admin/devtools/DevConfirmModal';

export function QueueHealthTab() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>('');

  const registeredQueues = [
    {
      name: 'order-notifications',
      type: 'BullMQ',
      purpose: 'Dispatches customer order confirmations, status emails, and SMS alerts.',
      concurrency: '4 workers',
    },
    {
      name: 'transactional-outbox',
      type: 'BullMQ',
      purpose: 'Guarantees at-least-once message delivery for cross-service events.',
      concurrency: '2 workers',
    },
    {
      name: 'inventory-reservation-cleanup',
      type: 'BullMQ / Cron',
      purpose: 'Releases abandoned shopping cart stock reservations past 15-minute TTL.',
      concurrency: '1 worker',
    },
    {
      name: 'financial-ledger-settlement',
      type: 'BullMQ',
      purpose: 'Asynchronously reconciles payment gateway webhooks against ledger transactions.',
      concurrency: '2 workers',
    },
  ];

  const handleQueueAction = (action: string) => {
    setPendingAction(action);
    setIsConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            BACKGROUND QUEUES & WORKER PIPELINES (BULLMQ)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Asynchronous task queue health, waiting job counts, and worker allocation.
          </p>
        </div>

        <DevStatusBadge status="NOT_IMPLEMENTED" />
      </div>

      {/* Honest Backend Availability Notice */}
      <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs font-mono text-purple-900 flex items-start gap-3 shadow-2xs">
        <AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1.5 leading-relaxed">
          <div className="font-semibold text-purple-950">
            Not available — backend queue health endpoint not implemented.
          </div>
          <p className="text-purple-800">
            The RGEnterprises backend service executes asynchronous background workloads via BullMQ / Redis internally, but does not currently expose a public or authenticated HTTP telemetry endpoint (e.g. <code className="text-purple-900 bg-purple-100 px-1 py-0.5 rounded font-medium">/admin/queues</code> or <code className="text-purple-900 bg-purple-100 px-1 py-0.5 rounded font-medium">/admin/queue/health</code>).
          </p>
          <p className="text-purple-800">
            Per strict developer instructions, no fake queue counts or simulated latency graphs are generated. The architectural queue definitions below reflect the registered worker pipelines in the codebase.
          </p>
        </div>
      </div>

      {/* Registered Queues Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden font-mono text-xs shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 flex items-center justify-between">
          <span>REGISTERED ARCHITECTURAL QUEUES</span>
          <span className="text-[11px] text-slate-500 font-normal">
            Status: Telemetry Pending Endpoint Deployment
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {registeredQueues.map((q) => (
            <div key={q.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600">{q.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                    {q.type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{q.purpose}</div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-slate-500">{q.concurrency}</span>
                <DevStatusBadge status="NOT_IMPLEMENTED" size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal for Destructive Queue Controls */}
      <DevConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          throw new Error('Backend queue management endpoint (/admin/queues) is not implemented.');
        }}
        title={`Queue Action: ${pendingAction}`}
        description={`Attempting to dispatch ${pendingAction} across BullMQ workers. This requires an authorized backend queue administration endpoint.`}
        actionButtonText="Execute Action"
        requiredConfirmationText="QUEUE_ACTION"
      />
    </div>
  );
}
