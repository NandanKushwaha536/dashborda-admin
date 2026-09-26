'use client';

import React, { useState } from 'react';
import { Order, OrderStatus } from '@/lib/api/types';
import { AdminDrawer } from '../ui/AdminDrawer';
import { AdminStatusBadge } from '../ui/AdminStatusBadge';
import { AdminButton } from '../ui/AdminButton';
import { useUpdateOrderStatus, useCancelOrder } from '@/lib/hooks/useOrders';
import {
  Package,
  Clock,
  User,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { getAppEnv } from '@/lib/env';

export function OrderDetailDrawer({
  order,
  isOpen,
  onClose,
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const env = getAppEnv();
  const updateStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();
  const [selectedNextStatus, setSelectedNextStatus] = useState<OrderStatus | ''>('');
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  if (!order) return null;

  const logisticsUrl = env.logisticsAppUrl;

  // Allowed state machine transitions
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['PACKED', 'CANCELLED'],
    PACKED: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'NDR', 'RTO'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'NDR', 'RTO'],
    NDR: ['OUT_FOR_DELIVERY', 'RTO', 'DELIVERED'],
    RTO: ['RETURNED'],
    DELIVERED: ['RETURNED'],
    CANCELLED: [],
    RETURNED: [],
  };

  const nextAllowedStates = transitions[order.status] || [];

  const handleAdvanceStatus = async () => {
    if (!selectedNextStatus) return;
    await updateStatusMutation.mutateAsync({
      id: order.id,
      status: selectedNextStatus,
    });
    setSelectedNextStatus('');
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) return;
    await cancelOrderMutation.mutateAsync({
      id: order.id,
      reason: cancelReason,
    });
    setIsCancelConfirmOpen(false);
  };

  return (
    <AdminDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span>Order #{order.orderNumber}</span>
          <AdminStatusBadge status={order.status} />
        </div>
      }
      subtitle={`Placed on ${new Date(order.placedAt).toLocaleString()}`}
      width="xl"
    >
      {/* 1. Quick Financial & Payment Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <div>
          <div className="text-[11px] font-medium text-slate-500 uppercase">Payment Status</div>
          <div className="mt-1">
            <AdminStatusBadge status={order.paymentStatus} size="sm" />
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 uppercase">Method</div>
          <div className="text-xs font-semibold text-slate-800 mt-1">{order.paymentMethod}</div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 uppercase">Total Amount</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            ₹{order.totalAmount.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 uppercase">Items</div>
          <div className="text-xs font-semibold text-slate-800 mt-1">
            {order.items.reduce((acc, item) => acc + item.quantity, 0)} units
          </div>
        </div>
      </div>

      {/* 2. State Machine Transitions */}
      {nextAllowedStates.length > 0 && order.status !== 'CANCELLED' && order.status !== 'RETURNED' && (
        <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Advance Order State
            </h4>
            <span className="text-[11px] text-blue-700">Backend State Engine</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {nextAllowedStates
              .filter((st) => st !== 'CANCELLED')
              .map((st) => (
                <AdminButton
                  key={st}
                  size="sm"
                  variant={selectedNextStatus === st ? 'primary' : 'outline'}
                  onClick={() => setSelectedNextStatus(st)}
                >
                  Advance to {st}
                </AdminButton>
              ))}

            {selectedNextStatus && (
              <AdminButton
                size="sm"
                variant="primary"
                isLoading={updateStatusMutation.isPending}
                onClick={handleAdvanceStatus}
              >
                Confirm Update
              </AdminButton>
            )}
          </div>
        </div>
      )}

      {/* 3. Read-Only Logistics Status & Link */}
      <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold uppercase text-slate-800 tracking-wider">
              Logistics & Fulfillment
            </span>
          </div>
          {logisticsUrl && (
            <a
              href={`${logisticsUrl}/shipments?orderNumber=${order.orderNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <span>Open in Logistics Center</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <span className="text-slate-500">Assigned Courier:</span>
            <p className="font-semibold text-slate-800">{order.courier || 'Pending Carrier Dispatch'}</p>
          </div>
          <div>
            <span className="text-slate-500">Tracking / AWB:</span>
            <p className="font-semibold text-slate-800">
              {order.trackingNumber || 'Pending AWB Generation'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Customer Information */}
      <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
        <div className="flex items-center gap-2 text-slate-800">
          <User className="w-4 h-4 text-slate-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider">Customer & Delivery</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500">Customer Details:</span>
            <p className="font-semibold text-slate-900 mt-0.5">{order.customer.name}</p>
            <p className="text-slate-600">{order.customer.email}</p>
            <p className="text-slate-600">{order.customer.phone}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-slate-500 mb-0.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Shipping Destination:</span>
            </div>
            <p className="text-slate-800 font-medium">{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && (
              <p className="text-slate-600">{order.shippingAddress.addressLine2}</p>
            )}
            <p className="text-slate-600">
              {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
              {order.shippingAddress.postalCode}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Order Items */}
      <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
        <div className="flex items-center justify-between text-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Purchased Items</h4>
          </div>
          <span className="text-xs text-slate-500">{order.items.length} unique SKUs</span>
        </div>

        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                <p className="text-slate-500 text-[11px]">
                  SKU: {item.sku} {item.variant ? `• ${item.variant}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-medium text-slate-900">₹{item.price.toLocaleString()} × {item.quantity}</div>
                <div className="font-bold text-slate-900 text-[13px]">₹{item.total.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing totals */}
        <div className="pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping Fee</span>
            <span>₹{order.shippingFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>GST / Tax</span>
            <span>₹{order.tax.toLocaleString()}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-teal-700 font-medium">
              <span>Discount</span>
              <span>-₹{order.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
            <span>Total Amount</span>
            <span>₹{order.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 6. Order Timeline */}
      {order.timeline && order.timeline.length > 0 && (
        <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
          <div className="flex items-center gap-2 text-slate-800">
            <Clock className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Audit Timeline</h4>
          </div>
          <div className="space-y-2.5">
            {order.timeline.map((evt, i) => (
              <div key={i} className="text-xs border-l-2 border-blue-500 pl-3 py-0.5 space-y-0.5">
                <div className="flex items-center justify-between text-slate-800">
                  <span className="font-semibold">{evt.title}</span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">{evt.description}</p>
                {evt.actor && (
                  <p className="text-[10px] text-slate-400 italic">By: {evt.actor}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Cancellation Option */}
      {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.status !== 'RETURNED' && (
        <div className="pt-2">
          {!isCancelConfirmOpen ? (
            <AdminButton
              variant="danger"
              size="sm"
              leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
              onClick={() => setIsCancelConfirmOpen(true)}
            >
              Cancel Order & Release Inventory
            </AdminButton>
          ) : (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-3 text-xs">
              <p className="font-semibold text-red-900">Confirm Order Cancellation</p>
              <input
                type="text"
                placeholder="Reason for cancellation (required)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-red-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-red-500 outline-none"
              />
              <div className="flex items-center gap-2">
                <AdminButton
                  variant="danger"
                  size="sm"
                  disabled={!cancelReason.trim()}
                  isLoading={cancelOrderMutation.isPending}
                  onClick={handleCancelOrder}
                >
                  Confirm Cancellation
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCancelConfirmOpen(false);
                    setCancelReason('');
                  }}
                >
                  Dismiss
                </AdminButton>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminDrawer>
  );
}
