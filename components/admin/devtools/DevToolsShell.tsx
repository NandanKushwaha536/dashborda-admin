'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Terminal,
  Activity,
  Code2,
  Server,
  Database,
  Cpu,
  Layers,
  Clock,
  Webhook,
  ListFilter,
  AlertTriangle,
  FileCode2,
  History,
  Zap,
  Flag,
  Shield,
  Tag,
  Lock,
  GitBranch,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { PermissionGate } from '@/components/admin/auth/PermissionGate';

// Tab Components
import { DevOverviewTab } from '@/components/admin/devtools/tabs/DevOverviewTab';
import { ApiExplorerTab } from '@/components/admin/devtools/tabs/ApiExplorerTab';
import { ApiHealthTab } from '@/components/admin/devtools/tabs/ApiHealthTab';
import { SystemHealthTab } from '@/components/admin/devtools/tabs/SystemHealthTab';
import { DatabaseHealthTab } from '@/components/admin/devtools/tabs/DatabaseHealthTab';
import { RedisHealthTab } from '@/components/admin/devtools/tabs/RedisHealthTab';
import { QueueHealthTab } from '@/components/admin/devtools/tabs/QueueHealthTab';
import { BackgroundJobsTab } from '@/components/admin/devtools/tabs/BackgroundJobsTab';
import { WebhooksTab } from '@/components/admin/devtools/tabs/WebhooksTab';
import { EventLogsTab } from '@/components/admin/devtools/tabs/EventLogsTab';
import { ErrorLogsTab } from '@/components/admin/devtools/tabs/ErrorLogsTab';
import { RequestLogsTab } from '@/components/admin/devtools/tabs/RequestLogsTab';
import { AuditDebuggerTab } from '@/components/admin/devtools/tabs/AuditDebuggerTab';
import { CacheTab } from '@/components/admin/devtools/tabs/CacheTab';
import { FeatureFlagsTab } from '@/components/admin/devtools/tabs/FeatureFlagsTab';
import { EnvironmentTab } from '@/components/admin/devtools/tabs/EnvironmentTab';
import { IntegrationStatusTab } from '@/components/admin/devtools/tabs/IntegrationStatusTab';
import { ReleaseVersionTab } from '@/components/admin/devtools/tabs/ReleaseVersionTab';
import { SecurityDiagnosticsTab } from '@/components/admin/devtools/tabs/SecurityDiagnosticsTab';
import { RequestTraceTab } from '@/components/admin/devtools/tabs/RequestTraceTab';

export type DevToolTabId =
  | 'overview'
  | 'api-explorer'
  | 'api-health'
  | 'system-health'
  | 'database-health'
  | 'redis-health'
  | 'queue-health'
  | 'background-jobs'
  | 'webhooks'
  | 'event-logs'
  | 'error-logs'
  | 'request-logs'
  | 'audit-debugger'
  | 'cache'
  | 'feature-flags'
  | 'environment'
  | 'integration-status'
  | 'release-version'
  | 'security-diagnostics'
  | 'request-trace';

interface TabItem {
  id: DevToolTabId;
  label: string;
  category: 'CORE' | 'HEALTH' | 'ASYNC' | 'LOGS' | 'SYSTEM' | 'SECURITY';
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { id: 'overview', label: 'Developer Overview', category: 'CORE', icon: Terminal },
  { id: 'api-explorer', label: 'API Explorer', category: 'CORE', icon: Code2 },
  { id: 'api-health', label: 'API Health', category: 'HEALTH', icon: Activity },
  { id: 'system-health', label: 'System Health', category: 'HEALTH', icon: Server },
  { id: 'database-health', label: 'Database Health', category: 'HEALTH', icon: Database },
  { id: 'redis-health', label: 'Redis Health', category: 'HEALTH', icon: Cpu },
  { id: 'queue-health', label: 'Queue Health', category: 'ASYNC', icon: Layers },
  { id: 'background-jobs', label: 'Background Jobs', category: 'ASYNC', icon: Clock },
  { id: 'webhooks', label: 'Webhooks', category: 'ASYNC', icon: Webhook },
  { id: 'event-logs', label: 'Event Logs', category: 'LOGS', icon: ListFilter },
  { id: 'error-logs', label: 'Error Logs', category: 'LOGS', icon: AlertTriangle },
  { id: 'request-logs', label: 'Request Logs', category: 'LOGS', icon: FileCode2 },
  { id: 'audit-debugger', label: 'Audit Debugger', category: 'LOGS', icon: History },
  { id: 'request-trace', label: 'Request Trace', category: 'LOGS', icon: GitBranch },
  { id: 'cache', label: 'Cache', category: 'SYSTEM', icon: Zap },
  { id: 'feature-flags', label: 'Feature Flags', category: 'SYSTEM', icon: Flag },
  { id: 'environment', label: 'Environment', category: 'SYSTEM', icon: Shield },
  { id: 'integration-status', label: 'Integration Status', category: 'SYSTEM', icon: Layers },
  { id: 'release-version', label: 'Release / Version', category: 'SYSTEM', icon: Tag },
  { id: 'security-diagnostics', label: 'Security Diagnostics', category: 'SECURITY', icon: Lock },
];

function DevToolsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const activeTabFromUrl = (searchParams.get('tab') as DevToolTabId) || 'overview';
  const [activeTab, setActiveTab] = useState<DevToolTabId>(activeTabFromUrl);

  // Sync tab state with URL search param
  useEffect(() => {
    const tab = searchParams.get('tab') as DevToolTabId;
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleSelectTab = (tabId: string) => {
    const validTab = (TABS.some((t) => t.id === tabId) ? tabId : 'overview') as DevToolTabId;
    setActiveTab(validTab);
    router.replace(`/admin/dev?tab=${validTab}`, { scroll: false });
  };

  const activeTabItem = TABS.find((t) => t.id === activeTab) || TABS[0];
  const ActiveIcon = activeTabItem.icon;

  return (
    <div className="bg-white text-slate-900 rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Top Breadcrumb & Status Bar */}
      <div className="px-5 py-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <ActiveIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-medium text-slate-600">Developer</span>
              <span>/</span>
              <span className="text-slate-500 uppercase">{activeTabItem.category}</span>
              <span>/</span>
              <span className="text-blue-600 font-semibold">{activeTabItem.label}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 font-sans mt-0.5">
              {activeTabItem.label}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Zero Secrets Exposed</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono">
            {process.env.NODE_ENV || 'production'}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 sm:p-6 lg:p-8 bg-white min-h-[600px]">
        {activeTab === 'overview' && <DevOverviewTab onSelectTab={handleSelectTab} />}
        {activeTab === 'api-explorer' && <ApiExplorerTab />}
        {activeTab === 'api-health' && <ApiHealthTab />}
        {activeTab === 'system-health' && <SystemHealthTab />}
        {activeTab === 'database-health' && <DatabaseHealthTab />}
        {activeTab === 'redis-health' && <RedisHealthTab />}
        {activeTab === 'queue-health' && <QueueHealthTab />}
        {activeTab === 'background-jobs' && <BackgroundJobsTab />}
        {activeTab === 'webhooks' && <WebhooksTab />}
        {activeTab === 'event-logs' && <EventLogsTab />}
        {activeTab === 'error-logs' && <ErrorLogsTab />}
        {activeTab === 'request-logs' && <RequestLogsTab />}
        {activeTab === 'audit-debugger' && <AuditDebuggerTab />}
        {activeTab === 'request-trace' && <RequestTraceTab />}
        {activeTab === 'cache' && <CacheTab />}
        {activeTab === 'feature-flags' && <FeatureFlagsTab />}
        {activeTab === 'environment' && <EnvironmentTab />}
        {activeTab === 'integration-status' && <IntegrationStatusTab />}
        {activeTab === 'release-version' && <ReleaseVersionTab />}
        {activeTab === 'security-diagnostics' && <SecurityDiagnosticsTab />}
      </div>
    </div>
  );
}

export function DevToolsShell() {
  return (
    <PermissionGate
      allowedRoles={['SUPER_ADMIN', 'DEVELOPER']}
      requiredPermission="DEVELOPER_TOOLS"
      fallback={
        <div className="min-h-screen bg-slate-50 text-slate-900 font-mono flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-xl bg-white border border-rose-200 text-center space-y-4 shadow-xl">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">ACCESS RESTRICTED</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Developer Tools are strictly restricted to accounts with <span className="text-rose-600 font-semibold">SUPER_ADMIN</span> or <span className="text-rose-600 font-semibold">DEVELOPER</span> authorization.
            </p>
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
              Frontend visibility is not security. Your role does not carry authoritative backend developer privileges.
            </div>
            <Link
              href="/admin"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Return to Admin Dashboard
            </Link>
          </div>
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="min-h-screen bg-white flex items-center justify-center font-mono text-xs text-slate-500">
            Initializing RGEnterprises Developer Tools...
          </div>
        }
      >
        <DevToolsInner />
      </Suspense>
    </PermissionGate>
  );
}
