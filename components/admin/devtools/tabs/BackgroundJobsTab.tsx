'use client';

import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';

export function BackgroundJobsTab() {
  const registeredJobs = [
    {
      name: 'Inventory TTL Expiry Monitor',
      interval: 'Every 5 minutes',
      handler: 'inventoryService.reapExpiredReservations()',
      description: 'Finds checkout stock locks older than 15 minutes and restores inventory counters.',
    },
    {
      name: 'Order Delivery Status Poller',
      interval: 'Every 30 minutes',
      handler: 'logisticsSyncWorker.pollShipmentStatus()',
      description: 'Synchronizes external carrier tracking states into internal order timeline.',
    },
    {
      name: 'Audit Log Archiver',
      interval: 'Daily at 02:00 UTC',
      handler: 'auditLogMaintenance.archiveOldEvents()',
      description: 'Rotates audit log records older than retention threshold (90 days).',
    },
    {
      name: 'Transactional Outbox Dispatcher',
      interval: 'Continuous (Event Loop)',
      handler: 'outboxWorker.processPendingEvents()',
      description: 'Dispatches staged domain events from the transactional outbox table to message broker.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            BACKGROUND WORKER SCHEDULER & CRON JOBS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered background workers, recurring cron tasks, and async lifecycle processors.
          </p>
        </div>

        <DevStatusBadge status="NOT_IMPLEMENTED" />
      </div>

      {/* Honest Backend Status Notice */}
      <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs font-mono text-purple-900 flex items-start gap-3 shadow-2xs">
        <AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1.5 leading-relaxed">
          <div className="font-semibold text-purple-950">
            Not available — backend background job monitoring endpoint not implemented.
          </div>
          <p className="text-purple-800">
            Scheduled jobs run as Node.js cron workers or BullMQ repeatable processors in the backend container runtime. The backend does not currently expose an HTTP administration route (such as <code className="text-purple-900 bg-purple-100 px-1 py-0.5 rounded font-medium">/admin/jobs</code>) for polling execution histories or manually triggering runs.
          </p>
        </div>
      </div>

      {/* Architectural Jobs Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden font-mono text-xs shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800">
          REGISTERED ARCHITECTURAL CRON WORKERS
        </div>

        <div className="divide-y divide-slate-100">
          {registeredJobs.map((job) => (
            <div key={job.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{job.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                    {job.interval}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{job.description}</div>
                <code className="text-[10px] text-slate-400">{job.handler}</code>
              </div>

              <DevStatusBadge status="NOT_IMPLEMENTED" size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
