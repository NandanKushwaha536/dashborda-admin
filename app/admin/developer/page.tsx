'use client';

import React, { Suspense, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleSlash, RefreshCw, XCircle } from 'lucide-react';
import {
  DATABASE_COLLECTIONS,
  useAuditLog,
  useDatabaseRows,
  useDeveloperAction,
  useDiagnostics,
  useMaintenanceMode,
  useQueueJobs,
  useServerOverview,
  type CheckStatus,
  type DiagnosticsReport,
} from '@/lib/hooks/useDeveloper';
import { useDebouncedValue, useUrlParams } from '@/lib/hooks/useUrlState';
import { useAuth } from '@/lib/auth/AuthContext';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { cn, errorMessage, formatDateTime, formatNumber, humanize } from '@/lib/format';
import { Restricted } from '@/components/shell/Restricted';
import { Card, DetailList, PageHeader, Section, StatTile } from '@/components/ui/Layout';
import { Badge, EmptyState, ErrorState, ListSkeleton, Notice, Skeleton } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { FormError, Input, Select } from '@/components/ui/Form';
import { Tabs, SearchInput } from '@/components/ui/Navigation';
import { Modal, useToast } from '@/components/ui/Overlay';

type DevTab = 'problems' | 'server' | 'jobs' | 'activity' | 'data' | 'tools';

const STATUS_STYLE: Record<CheckStatus, { label: string; tone: 'green' | 'amber' | 'red' | 'neutral'; Icon: typeof CheckCircle2; color: string }> = {
  ok: { label: 'OK', tone: 'green', Icon: CheckCircle2, color: 'text-green-600' },
  warn: { label: 'Check', tone: 'amber', Icon: AlertTriangle, color: 'text-amber-600' },
  fail: { label: 'Problem', tone: 'red', Icon: XCircle, color: 'text-red-600' },
  skipped: { label: 'Skipped', tone: 'neutral', Icon: CircleSlash, color: 'text-slate-400' },
};

const OVERALL: Record<DiagnosticsReport['overall'], { title: string; tone: 'success' | 'warning' | 'danger' }> = {
  healthy: { title: 'Everything is working', tone: 'success' },
  degraded: { title: 'Working, with things to check', tone: 'warning' },
  down: { title: 'Something important is down', tone: 'danger' },
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [days ? `${days}d` : '', hours ? `${hours}h` : '', `${minutes}m`].filter(Boolean).join(' ');
}

/** Asks for the owner's password before a developer action (backend step-up). */
function ConfirmWithPassword({
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onClose,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!password) return setError('Enter your password to confirm.');
    setBusy(true);
    setError(null);
    try {
      await onConfirm(password);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={submit} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="text-sm text-slate-700">{message}</div>
        <FormError message={error} />
        <Input
          label="Your password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && void submit()}
        />
      </div>
    </Modal>
  );
}

function ProblemFinder() {
  const [deep, setDeep] = useState(false);
  const report = useDiagnostics(deep);
  const data = report.data;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />} loading={report.isFetching && !deep} onClick={() => (deep ? setDeep(false) : void report.refetch())}>
          Run check again
        </Button>
        <Button variant="secondary" loading={report.isFetching && deep} onClick={() => (deep ? void report.refetch() : setDeep(true))}>
          Deep check (tests payment, email and image service keys)
        </Button>
      </div>

      {report.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : report.error ? (
        <ErrorState message={errorMessage(report.error)} onRetry={() => report.refetch()} />
      ) : data ? (
        <>
          <Notice tone={OVERALL[data.overall].tone} title={OVERALL[data.overall].title}>
            {data.firstProblem ? (
              <span>
                Start here: <strong>{data.firstProblem.group} › {data.firstProblem.title}</strong> — {data.firstProblem.detail}
                {data.firstProblem.fix ? <span className="mt-1 block">What to do: {data.firstProblem.fix}</span> : null}
              </span>
            ) : (
              `Checked ${formatDateTime(data.checkedAt)} in ${formatNumber(data.durationMs)} ms (${data.environment}).`
            )}
          </Notice>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="OK" value={formatNumber(data.counts.ok)} />
            <StatTile label="To check" value={formatNumber(data.counts.warn)} />
            <StatTile label="Problems" value={formatNumber(data.counts.fail)} />
            <StatTile label="Server errors (15 min)" value={formatNumber(data.traffic.last15Minutes.serverErrors)} />
          </div>
          {data.groups.map((group) => (
            <Section key={group.id} title={group.title} actions={<Badge tone={STATUS_STYLE[group.status].tone}>{STATUS_STYLE[group.status].label}</Badge>}>
              <ul className="flex flex-col divide-y divide-slate-100">
                {group.checks.map((check) => {
                  const style = STATUS_STYLE[check.status];
                  return (
                    <li key={check.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <style.Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.color)} aria-label={style.label} />
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="text-sm font-semibold text-slate-900">{check.title}</span>
                        <span className="break-words text-[13px] text-slate-700">{check.detail}</span>
                        {check.fix && check.status !== 'ok' ? (
                          <span className="text-[13px] text-indigo-800">
                            <strong>Fix:</strong> {check.fix}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>
          ))}
          <Section title="Recent server errors" description={`Since ${formatDateTime(data.traffic.recordingSince)} (cleared when the server restarts).`}>
            {data.recentErrors.length === 0 ? (
              <p className="text-sm text-slate-600">No errors recorded.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-slate-100">
                {data.recentErrors.map((entry, index) => (
                  <li key={`${entry.at}-${index}`} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={entry.status >= 500 ? 'red' : 'amber'}>{entry.status}</Badge>
                      <span className="font-mono text-[13px] text-slate-900">
                        {entry.method} {entry.route}
                      </span>
                      <span className="text-[12px] text-slate-500">{formatDateTime(entry.at)}</span>
                    </div>
                    <span className="break-words text-[13px] text-slate-700">
                      {entry.name}: {entry.message}
                    </span>
                    {entry.location ? <span className="font-mono text-[12px] text-slate-500">at {entry.location}</span> : null}
                    {entry.requestId ? <span className="font-mono text-[12px] text-slate-400">request {entry.requestId}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>
          {data.slowRequests.length > 0 ? (
            <Section title="Slow requests">
              <ul className="flex flex-col divide-y divide-slate-100">
                {data.slowRequests.map((entry, index) => (
                  <li key={`${entry.at}-${index}`} className="flex flex-wrap items-center gap-2 py-2.5 text-[13px]">
                    <span className="tabular font-semibold text-slate-900">{formatNumber(entry.durationMs)} ms</span>
                    <span className="font-mono text-slate-700">
                      {entry.method} {entry.route}
                    </span>
                    <span className="text-slate-500">{formatDateTime(entry.at)}</span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ServerInfo() {
  const overview = useServerOverview();
  if (overview.isLoading) return <Skeleton className="h-48 w-full" />;
  if (overview.error || !overview.data) return <ErrorState message={errorMessage(overview.error)} onRetry={() => overview.refetch()} />;
  const o = overview.data;
  const dependency = (value: string) => <Badge tone={value === 'healthy' || value === 'configured' ? 'green' : value === 'disabled' ? 'neutral' : 'red'}>{humanize(value)}</Badge>;
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Section title="Server" description="Refreshes every 30 seconds.">
        <DetailList
          items={[
            { label: 'Environment', value: o.environment },
            { label: 'Node.js', value: o.nodeVersion },
            { label: 'Running for', value: formatUptime(o.uptimeSeconds) },
            { label: 'Memory in use', value: `${formatNumber(o.memory.heapUsedMb)} MB of ${formatNumber(o.memory.heapTotalMb)} MB (process ${formatNumber(o.memory.rssMb)} MB)` },
          ]}
        />
      </Section>
      <Section title="Connected services">
        <DetailList
          items={[
            { label: 'Database (MongoDB)', value: dependency(o.dependencies.mongo) },
            { label: 'Redis', value: <span className="flex items-center gap-2">{dependency(o.dependencies.redis)}{o.dependencies.redisLatencyMs !== null ? <span className="text-[12px] text-slate-500">{o.dependencies.redisLatencyMs} ms</span> : null}</span> },
            { label: 'Notification queue', value: dependency(o.dependencies.notificationQueue) },
          ]}
        />
      </Section>
    </div>
  );
}

function Jobs({ canWrite }: { canWrite: boolean }) {
  const toast = useToast();
  const jobs = useQueueJobs();
  const action = useDeveloperAction();
  const [confirm, setConfirm] = useState<{ jobId?: string } | null>(null);
  if (jobs.isLoading) return <ListSkeleton rows={4} />;
  if (jobs.error || !jobs.data) return <ErrorState message={errorMessage(jobs.error)} onRetry={() => jobs.refetch()} />;
  if (!jobs.data.enabled) {
    return (
      <Card>
        <EmptyState title="The background queue is off" description="Emails, SMS and WhatsApp messages are sent straight away instead. Turn on Redis (REDIS_ENABLED) to use the queue." />
      </Card>
    );
  }
  const failed = jobs.data.jobs.filter((job) => job.status === 'failed');
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {['waiting', 'active', 'delayed', 'failed', 'completed'].map((key) => (
          <StatTile key={key} label={humanize(key)} value={formatNumber(jobs.data!.counts[key] ?? 0)} />
        ))}
      </div>
      <Section
        title="Jobs"
        actions={
          canWrite && failed.length > 0 ? (
            <Button size="sm" variant="secondary" onClick={() => setConfirm({})}>
              Retry all failed
            </Button>
          ) : null
        }
      >
        {jobs.data.jobs.length === 0 ? (
          <p className="text-sm text-slate-600">No jobs waiting or failed.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-100">
            {jobs.data.jobs.map((job) => (
              <li key={`${job.status}-${job.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium text-slate-900">{humanize(job.name)}</span>
                  <span className="text-[12.5px] text-slate-500">
                    {formatDateTime(new Date(job.timestamp).toISOString())} · tried {job.attemptsMade}×
                  </span>
                  {job.failedReason ? <span className="break-words text-[12.5px] text-red-700">{job.failedReason}</span> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={job.status === 'failed' ? 'red' : job.status === 'active' ? 'blue' : 'neutral'}>{humanize(job.status)}</Badge>
                  {canWrite && job.status === 'failed' ? (
                    <Button size="sm" variant="secondary" icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />} onClick={() => setConfirm({ jobId: job.id })}>
                      Retry
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {confirm ? (
        <ConfirmWithPassword
          title={confirm.jobId ? 'Retry this job?' : `Retry ${failed.length} failed jobs?`}
          message="The message will be sent again."
          confirmLabel="Retry"
          onClose={() => setConfirm(null)}
          onConfirm={async (password) => {
            await action.mutateAsync({ action: confirm.jobId ? { kind: 'retryJob', jobId: confirm.jobId } : { kind: 'retryFailed' }, password });
            toast.success('Retry requested.');
          }}
        />
      ) : null}
    </div>
  );
}

function Activity() {
  const log = useAuditLog();
  if (log.isLoading) return <ListSkeleton rows={6} />;
  if (log.error) return <ErrorState message={errorMessage(log.error)} onRetry={() => log.refetch()} />;
  const rows = log.data ?? [];
  return (
    <Section title="Activity log" description="The latest 100 changes made by staff and the system.">
      {rows.length === 0 ? (
        <p className="text-sm text-slate-600">Nothing recorded yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-100">
          {rows.map((entry) => (
            <li key={entry._id} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{humanize(entry.action)}</span>
                <Badge>{entry.resource}</Badge>
                {entry.resourceId ? <span className="font-mono text-[12px] text-slate-500">{entry.resourceId}</span> : null}
              </div>
              <span className="text-[12.5px] text-slate-600">
                {entry.actor?.name ?? 'System'}
                {entry.actor?.email ? ` (${entry.actor.email})` : ''} · {formatDateTime(entry.createdAt)}
                {entry.ip ? ` · ${entry.ip}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function DataViewer() {
  const [collection, setCollection] = useState<string>('Order');
  const [searchText, setSearchText] = useState('');
  const search = useDebouncedValue(searchText);
  const rows = useDatabaseRows(collection, search);
  return (
    <Section title="Data viewer" description="Read-only. Passwords and tokens are never shown. Shows the newest 20 records.">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Select
            label="Collection"
            containerClassName="sm:w-56"
            value={collection}
            onChange={(event) => setCollection(event.target.value)}
            options={DATABASE_COLLECTIONS.map((name) => ({ value: name, label: name }))}
          />
          <SearchInput className="sm:flex-1" label="Search records" placeholder="Id, order number, SKU, code, email or name" value={searchText} onChange={setSearchText} />
        </div>
        {rows.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : rows.error ? (
          <ErrorState message={errorMessage(rows.error)} onRetry={() => rows.refetch()} />
        ) : (rows.data ?? []).length === 0 ? (
          <p className="text-sm text-slate-600">No records found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(rows.data ?? []).map((row, index) => (
              <details key={String(row._id ?? index)} className="rounded-lg border border-slate-200 bg-slate-50">
                <summary className="cursor-pointer px-3 py-2.5 text-[13px] font-medium text-slate-800">
                  <span className="font-mono">{String(row.orderNumber ?? row.sku ?? row.code ?? row.email ?? row.name ?? row._id)}</span>
                  {row.createdAt ? <span className="ml-2 text-slate-500">{formatDateTime(String(row.createdAt))}</span> : null}
                </summary>
                <pre className="max-h-96 overflow-auto border-t border-slate-200 bg-white p-3 text-[12px] leading-relaxed text-slate-800">{JSON.stringify(row, null, 2)}</pre>
              </details>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

function Tools() {
  const toast = useToast();
  const action = useDeveloperAction();
  const maintenance = useMaintenanceMode();
  const [dialog, setDialog] = useState<'cache' | 'reservations' | 'maintenance' | null>(null);
  const maintenanceOn = Boolean(maintenance.data);

  const tool = (title: string, description: string, button: React.ReactNode) => (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex max-w-xl flex-col gap-1">
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        <span className="text-[13px] text-slate-600">{description}</span>
      </div>
      {button}
    </div>
  );

  return (
    <Section title="Fix-it tools" description="Each one asks for your password and is written to the activity log.">
      <div className="flex flex-col divide-y divide-slate-100">
        {tool(
          'Clear the product cache',
          'Use when a product, price or stock change does not show on the website yet. Products are cached for a short time to keep the store fast.',
          <Button variant="secondary" onClick={() => setDialog('cache')}>
            Clear cache
          </Button>
        )}
        {tool(
          'Release expired stock holds',
          'Frees stock held by carts and unpaid orders whose time has run out, if the automatic job missed them.',
          <Button variant="secondary" onClick={() => setDialog('reservations')}>
            Release now
          </Button>
        )}
        {tool(
          'Maintenance mode',
          maintenanceOn
            ? 'ON: customers can browse but cannot place orders. The website shows a notice.'
            : 'Pause new orders while you fix something. Customers can still browse.',
          <Button variant={maintenanceOn ? 'primary' : 'danger'} loading={maintenance.isLoading} onClick={() => setDialog('maintenance')}>
            {maintenanceOn ? 'Turn off (open orders)' : 'Turn on (pause orders)'}
          </Button>
        )}
      </div>

      {dialog === 'cache' ? (
        <ConfirmWithPassword
          title="Clear the product cache?"
          message="The website loads fresh data on the next visit. Nothing is deleted."
          confirmLabel="Clear cache"
          onClose={() => setDialog(null)}
          onConfirm={async (password) => {
            await action.mutateAsync({ action: { kind: 'clearCache', namespace: 'products' }, password });
            toast.success('Cache cleared.');
          }}
        />
      ) : null}
      {dialog === 'reservations' ? (
        <ConfirmWithPassword
          title="Release expired stock holds?"
          message="Only holds that have already expired are released."
          confirmLabel="Release"
          onClose={() => setDialog(null)}
          onConfirm={async (password) => {
            await action.mutateAsync({ action: { kind: 'expireReservations' }, password });
            toast.success('Expired holds released.');
          }}
        />
      ) : null}
      {dialog === 'maintenance' ? (
        <ConfirmWithPassword
          title={maintenanceOn ? 'Open the store for orders?' : 'Pause new orders?'}
          message={maintenanceOn ? 'Customers can place orders again.' : 'Customers will see a notice and cannot place orders until you turn this off.'}
          confirmLabel={maintenanceOn ? 'Turn off' : 'Turn on'}
          danger={!maintenanceOn}
          onClose={() => setDialog(null)}
          onConfirm={async (password) => {
            await action.mutateAsync({ action: { kind: 'maintenance', enabled: !maintenanceOn }, password });
            toast.success(maintenanceOn ? 'Orders are open.' : 'New orders are paused.');
          }}
        />
      ) : null}
    </Section>
  );
}

function DeveloperView() {
  const { can } = useAuth();
  const [query, setQuery] = useUrlParams(['tab'] as const);
  const tab = (query.tab || 'problems') as DevTab;
  const canWrite = can(PERMISSIONS.DEVELOPER_TOOLS_WRITE);
  const tabs: Array<{ value: DevTab; label: string }> = [
    { value: 'problems', label: 'Problem finder' },
    { value: 'server', label: 'Server' },
    { value: 'jobs', label: 'Background jobs' },
    { value: 'activity', label: 'Activity log' },
    { value: 'data', label: 'Data viewer' },
    ...(canWrite ? [{ value: 'tools' as const, label: 'Tools' }] : []),
  ];
  return (
    <>
      <PageHeader title="Developer tools" description="Find and fix problems: live health checks, errors, background jobs, activity and safe fix-it tools." />
      <Card className="md:px-2">
        <div className="pt-3 md:pt-0">
          <Tabs<DevTab> label="Developer tools section" value={tab} onChange={(value) => setQuery({ tab: value === 'problems' ? null : value })} items={tabs} />
        </div>
      </Card>
      {tab === 'server' ? <ServerInfo /> : tab === 'jobs' ? <Jobs canWrite={canWrite} /> : tab === 'activity' ? <Activity /> : tab === 'data' ? <DataViewer /> : tab === 'tools' && canWrite ? <Tools /> : <ProblemFinder />}
    </>
  );
}

export default function DeveloperPage() {
  return (
    <Restricted permission={PERMISSIONS.DEVELOPER_TOOLS_READ}>
      <Suspense fallback={null}>
        <DeveloperView />
      </Suspense>
    </Restricted>
  );
}
