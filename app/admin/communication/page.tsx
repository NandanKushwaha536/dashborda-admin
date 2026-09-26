'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Mail,
  MessageSquare,
  FileText,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/lib/hooks/useGovernance';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardBody, AdminCardHeader } from '@/components/admin/ui/AdminCard';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'email' | 'sms' | 'templates'>('notifications');

  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Communication & Notification Channels"
        description="Manage system broadcasts, customer transactional alerts, SMTP email relays, and SMS gateways."
        actions={
          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Refresh
            </AdminButton>
            {activeTab === 'notifications' && notifications.some((n) => !n.isRead) && (
              <AdminButton
                variant="primary"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                Mark All as Read
              </AdminButton>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'notifications', label: 'System Notifications', icon: Bell, badge: notifications.filter((n) => !n.isRead).length },
          { id: 'email', label: 'Email Gateway (SMTP)', icon: Mail },
          { id: 'sms', label: 'SMS & WhatsApp Gateway', icon: MessageSquare },
          { id: 'templates', label: 'Message Templates', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Notifications */}
      {activeTab === 'notifications' && (
        <AdminCard>
          <AdminCardHeader
            title="Administrator Notification Feed"
            description="Real-time alerts for incoming orders, low stock inventory thresholds, and customer inquiries."
          />
          <AdminCardBody className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12">
                <AdminEmptyState
                  icon={<Bell className="w-6 h-6" />}
                  title="No notifications"
                  description="System alerts and operational updates will appear here."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                      item.isRead ? 'bg-white' : 'bg-blue-50/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          item.type === 'ORDER'
                            ? 'bg-blue-100 text-blue-700'
                            : item.type === 'INVENTORY'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p className={`text-xs ${item.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-600">{item.message}</p>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {!item.isRead && (
                      <AdminButton
                        size="xs"
                        variant="outline"
                        onClick={() => markReadMutation.mutate(item.id)}
                        disabled={markReadMutation.isPending}
                      >
                        Dismiss
                      </AdminButton>
                    )}
                  </div>
                ))}
              </div>
            )}
          </AdminCardBody>
        </AdminCard>
      )}

      {/* Tab 2: Email Gateway */}
      {activeTab === 'email' && (
        <AdminCard>
          <AdminCardHeader
            title="SMTP / Transactional Email Relay"
            description="Status of email dispatch infrastructure used for order confirmations and receipts."
          />
          <AdminCardBody className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">Email Relay Node Configured</p>
                <p>
                  Transactional notifications are dispatched via authenticated SMTP. Delivery logs are captured in developer request traces.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">Sender Identity</span>
                <div className="text-slate-600">noreply@rgenterprises.com</div>
                <div className="text-[11px] text-slate-500">Verified SPF & DKIM</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">Support Inbound</span>
                <div className="text-slate-600">support@rgenterprises.com</div>
                <div className="text-[11px] text-slate-500">Monitored for buyer queries</div>
              </div>
            </div>
          </AdminCardBody>
        </AdminCard>
      )}

      {/* Tab 3: SMS Gateway */}
      {activeTab === 'sms' && (
        <AdminCard>
          <AdminCardHeader
            title="SMS & WhatsApp Gateway"
            description="Real-time SMS dispatch status for OTPs and courier delivery milestones."
          />
          <AdminCardBody className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">SMS Gateway Bridge</p>
                <p>
                  SMS dispatch operates in conjunction with order state updates. DLT registration is active for transactional templates.
                </p>
              </div>
            </div>
          </AdminCardBody>
        </AdminCard>
      )}

      {/* Tab 4: Message Templates */}
      {activeTab === 'templates' && (
        <AdminCard>
          <AdminCardHeader
            title="Standard Transactional Templates"
            description="Pre-approved message layouts triggered automatically by order lifecycle events."
          />
          <AdminCardBody className="p-0">
            <div className="divide-y divide-slate-100 text-xs">
              {[
                { name: 'Order Confirmation', trigger: 'Status changes to CONFIRMED', channel: 'Email & SMS' },
                { name: 'Dispatch & Courier Tracking', trigger: 'Shipment handed over to courier', channel: 'Email & SMS' },
                { name: 'Out for Delivery', trigger: 'Courier marks parcel out for delivery', channel: 'SMS / WhatsApp' },
                { name: 'Order Delivered', trigger: 'Parcel marked DELIVERED', channel: 'Email & SMS' },
                { name: 'Refund Processed', trigger: 'Finance approves return refund', channel: 'Email & SMS' },
              ].map((tpl) => (
                <div key={tpl.name} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-900 block">{tpl.name}</span>
                    <span className="text-slate-500 text-[11px]">Trigger: {tpl.trigger}</span>
                  </div>
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {tpl.channel}
                  </span>
                </div>
              ))}
            </div>
          </AdminCardBody>
        </AdminCard>
      )}
    </div>
  );
}
