'use client';

import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings, StoreSettings } from '@/lib/hooks/useSettings';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';
import { PermissionGate } from '@/components/admin/auth/PermissionGate';
import { Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const { data: serverSettings } = useSettings();
  const updateMutation = useUpdateSettings();

  const [isSaved, setIsSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'RGEnterprises Store',
    supportEmail: 'support@rgenterprises.com',
    currency: 'INR',
    taxRate: 18,
    lowStockThreshold: 5,
    autoConfirmOrders: false,
  });

  useEffect(() => {
    if (serverSettings) {
      setSettings(serverSettings);
    }
  }, [serverSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    await updateMutation.mutateAsync(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <PermissionGate allowedRoles={['SUPER_ADMIN']} requiredPermission="manage:settings">
      <div className="space-y-6">
        <AdminPageHeader
          title="Store & Operations Settings"
          description="Configure global commercial parameters, tax defaults, and inventory thresholds."
        />

        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          <AdminCard>
            <AdminCardHeader title="General Commerce Identity" />
            <AdminCardBody className="space-y-4">
              <AdminInput
                label="Store Display Name"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                required
              />

              <AdminInput
                label="Public Support Email"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                required
              />

              <AdminSelect
                label="Operating Currency"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                options={[
                  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
                  { value: 'USD', label: 'USD ($) - US Dollar' },
                ]}
              />
            </AdminCardBody>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="Taxation & Inventory Limits" />
            <AdminCardBody className="space-y-4">
              <AdminInput
                label="Default GST / Tax Rate (%)"
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
                step={0.5}
                required
              />

              <AdminInput
                label="Low Stock Warning Threshold (units)"
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value, 10) || 0 })
                }
                min={0}
                required
              />

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="autoConfirm"
                  checked={Boolean(settings.autoConfirmOrders)}
                  onChange={(e) => setSettings({ ...settings, autoConfirmOrders: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="autoConfirm" className="text-slate-700 font-medium cursor-pointer text-xs">
                  Automatically confirm orders upon verified payment gateway capture
                </label>
              </div>
            </AdminCardBody>
          </AdminCard>

          <div className="flex items-center gap-3">
            <AdminButton
              type="submit"
              variant="primary"
              size="md"
              isLoading={updateMutation.isPending}
              leftIcon={isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            >
              {isSaved ? 'Settings Saved' : 'Save Configuration'}
            </AdminButton>
          </div>
        </form>

        <AdminConfirmDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirmSave}
          title="Confirm Global Settings Update"
          message="Updating store settings impacts global tax rates, threshold calculations, and automated order confirmations across the entire platform. Do you wish to apply these changes?"
          confirmLabel="Apply Settings"
          isLoading={updateMutation.isPending}
        />
      </div>
    </PermissionGate>
  );
}
