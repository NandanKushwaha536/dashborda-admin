'use client';

import React, { useState } from 'react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardHeader, AdminCardBody } from '@/components/admin/ui/AdminCard';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { BarChart3, Download, FileSpreadsheet } from 'lucide-react';

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = (reportType: string) => {
    setIsExporting(reportType);
    setTimeout(() => {
      const csvPayload = `Report: ${reportType}\nGenerated: ${new Date().toISOString()}\nStatus: Authoritative Sync\n`;
      const blob = new Blob([csvPayload], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportType.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(null);
    }, 400);
  };

  const reports = [
    {
      title: 'Sales & Revenue Ledger',
      description: 'Comprehensive line-item order transactions with tax breakdowns and discount values.',
      type: 'SALES_REPORT',
    },
    {
      title: 'Inventory Stock Valuation',
      description: 'Current physical inventory counts, reorder alerts, and warehouse valuation figures.',
      type: 'INVENTORY_REPORT',
    },
    {
      title: 'Customer Lifetime Activity',
      description: 'Customer order frequency, gross spend, and account verification statuses.',
      type: 'CUSTOMERS_REPORT',
    },
    {
      title: 'GST / Statutory Tax Summary',
      description: 'State-wise tax liabilities collected on commerce transactions for tax filings.',
      type: 'TAX_REPORT',
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Business Reports & Data Exports"
        description="Generate and export auditable commercial CSV reports for external compliance."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((r) => (
          <AdminCard key={r.type} className="flex flex-col justify-between">
            <AdminCardHeader
              title={r.title}
              action={<FileSpreadsheet className="w-5 h-5 text-blue-600" />}
            />
            <AdminCardBody className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Format: CSV</span>
                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(r.type)}
                  isLoading={isExporting === r.type}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download Report
                </AdminButton>
              </div>
            </AdminCardBody>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
