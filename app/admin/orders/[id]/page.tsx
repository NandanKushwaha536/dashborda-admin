'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrder } from '@/lib/hooks/useOrders';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { ArrowLeft, User, MapPin, Package, ShieldCheck, ExternalLink } from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const { data: order, isLoading, error, refetch } = useOrder(id);
  const logisticsUrl = process.env.NEXT_PUBLIC_LOGISTICS_APP_URL || 'http://localhost:3002';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminSkeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminSkeleton className="h-64 md:col-span-2" />
          <AdminSkeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-12">
        <AdminErrorState
          title="Order not found"
          message={`Could not load details for order identifier ${id}.`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Order #${order.orderNumber}`}
        description={`Placed on ${new Date(order.placedAt).toLocaleString()}`}
        breadcrumbs={[
          { label: 'Orders', href: '/admin/orders' },
          { label: `#${order.orderNumber}` },
        ]}
        actions={
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/orders')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back to Orders
          </AdminButton>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard>
            <AdminCardHeader
              title="Purchased Items"
              subtitle={`${order.items.length} unique line items`}
            />
            <div className="divide-y divide-slate-100 p-6 text-xs">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-slate-400 text-[11px]">
                      SKU: {item.sku} {item.variant ? `• ${item.variant}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-600">₹{item.price.toLocaleString()} × {item.quantity}</p>
                    <p className="font-bold text-slate-900 text-sm">₹{item.total.toLocaleString()}</p>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-200 space-y-1 text-right text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>₹{order.shippingFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (GST)</span>
                  <span>₹{order.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Grand Total</span>
                  <span>₹{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <AdminCard>
            <AdminCardHeader title="Order & Payment Status" />
            <AdminCardBody className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Fulfillment Status:</span>
                <AdminStatusBadge status={order.status} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <AdminStatusBadge status={order.paymentStatus} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800">{order.paymentMethod}</span>
              </div>
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader
              title="Logistics Handoff"
              action={
                <a
                  href={`${logisticsUrl}/shipments?orderNumber=${order.orderNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Logistics Center</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              }
            />
            <AdminCardBody className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Carrier:</span>
                <p className="font-semibold text-slate-800">{order.courier || 'Pending Carrier Dispatch'}</p>
              </div>
              <div>
                <span className="text-slate-400">Tracking Number:</span>
                <p className="font-semibold text-slate-800">{order.trackingNumber || 'Pending AWB Generation'}</p>
              </div>
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="Customer & Delivery" />
            <AdminCardBody className="space-y-3 text-xs">
              <div>
                <p className="font-semibold text-slate-900">{order.customer?.name || 'Guest Customer'}</p>
                <p className="text-slate-500">{order.customer.email}</p>
                <p className="text-slate-500">{order.customer.phone}</p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block mb-1">Shipping Address:</span>
                <p className="text-slate-800">{order.shippingAddress.addressLine1}</p>
                <p className="text-slate-600">
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                </p>
              </div>
            </AdminCardBody>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
