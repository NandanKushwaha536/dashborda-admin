'use client';

import React from 'react';
import { Webhook, AlertCircle, ShieldCheck } from 'lucide-react';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';

export function WebhooksTab() {
  const registeredWebhooks = [
    {
      provider: 'Razorpay Payment Gateway',
      ingressEndpoint: '/api/v1/webhooks/razorpay',
      events: ['payment.captured', 'payment.failed', 'refund.processed', 'order.paid'],
      signatureVerification: 'HMAC-SHA256 (Webhook Secret Verified)',
      status: 'CONFIGURED',
    },
    {
      provider: 'Logistics Courier Partner',
      ingressEndpoint: '/api/v1/webhooks/logistics',
      events: ['shipment.dispatched', 'shipment.in_transit', 'shipment.delivered', 'shipment.ndr'],
      signatureVerification: 'API Key / Token Bearer Header',
      status: 'CONFIGURED',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 font-mono flex items-center gap-2">
            <Webhook className="w-4 h-4 text-blue-600" />
            INBOUND WEBHOOK SUBSCRIBERS & INGRESS CONTROLLERS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered external event ingress endpoints and cryptographic signature verifiers.
          </p>
        </div>

        <DevStatusBadge status="NOT_IMPLEMENTED" />
      </div>

      {/* Honest Backend Status Notice */}
      <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs font-mono text-purple-900 flex items-start gap-3 shadow-2xs">
        <AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1.5 leading-relaxed">
          <div className="font-semibold text-purple-950">
            Not available — backend webhook event query endpoint not implemented.
          </div>
          <p className="text-purple-800">
            The backend exposes ingress endpoints to receive webhooks from payment gateways and logistics providers, but does not currently maintain an HTTP query route (e.g. <code className="text-purple-900 bg-purple-100 px-1 py-0.5 rounded font-medium">/admin/webhooks</code>) for inspecting incoming webhook payloads or delivery logs.
          </p>
        </div>
      </div>

      {/* Registered Webhooks */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden font-mono text-xs shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 flex items-center justify-between">
          <span>REGISTERED INGRESS CONTROLLERS</span>
          <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Secrets Redacted & Protected
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {registeredWebhooks.map((item) => (
            <div key={item.provider} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{item.provider}</span>
                  <div className="text-[11px] text-blue-600 mt-0.5 font-medium">{item.ingressEndpoint}</div>
                </div>
                <DevStatusBadge status={item.status} size="sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-500">Signature Verification:</span>{' '}
                  <span className="text-slate-800 font-medium">{item.signatureVerification}</span>
                </div>
                <div>
                  <span className="text-slate-500">Supported Events:</span>{' '}
                  <span className="text-slate-800 font-medium">{item.events.join(', ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
