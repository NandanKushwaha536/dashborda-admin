'use client';

import React, { useState } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Code2,
  ListFilter,
  CheckCircle2,
  AlertCircle,
  Clock,
  KeyRound,
  FileJson,
} from 'lucide-react';
import { REGISTERED_API_ROUTES } from '@/lib/devtools/registry';
import { ApiExplorerParam } from '@/lib/api/types';
import { executeApiExplorerRequest } from '@/lib/hooks/useDevTools';
import { DevJsonViewer } from '@/components/admin/devtools/DevJsonViewer';
import { DevStatusBadge } from '@/components/admin/devtools/DevStatusBadge';

export function ApiExplorerTab() {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(REGISTERED_API_ROUTES[0].id);
  const [customPath, setCustomPath] = useState<string>(REGISTERED_API_ROUTES[0].path);
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [queryParams, setQueryParams] = useState<ApiExplorerParam[]>([]);
  const [pathParamId, setPathParamId] = useState<string>('');
  const [requestBody, setRequestBody] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    durationMs: number;
    data: unknown;
    rawText: string;
    requestId?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // When a preset route is chosen from dropdown
  const handleRouteChange = (routeId: string) => {
    setSelectedRouteId(routeId);
    const route = REGISTERED_API_ROUTES.find((r) => r.id === routeId);
    if (route) {
      setCustomPath(route.path);
      setMethod(route.method);
      if (route.defaultParams) {
        setQueryParams(
          Object.entries(route.defaultParams).map(([key, value]) => ({
            key,
            value,
            enabled: true,
          }))
        );
      } else {
        setQueryParams([]);
      }
      if (route.sampleBody) {
        setRequestBody(JSON.stringify(route.sampleBody, null, 2));
      } else {
        setRequestBody('');
      }
      setError(null);
    }
  };

  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '', enabled: true }]);
  };

  const updateQueryParam = (index: number, field: keyof ApiExplorerParam, val: string | boolean) => {
    setQueryParams((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  };

  const removeQueryParam = (index: number) => {
    setQueryParams((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setError(null);
    setExecutionResult(null);

    try {
      let resolvedPath = customPath.trim();

      // Guard: Only relative backend paths permitted
      if (!resolvedPath.startsWith('/') || resolvedPath.includes('://')) {
        throw new Error('Security Restriction: Only registered relative RGEnterprises API routes are permitted.');
      }

      // Handle path parameter :id substitution if present
      if (resolvedPath.includes(':id')) {
        if (!pathParamId.trim()) {
          throw new Error('Please enter a Resource ID to replace :id in the endpoint path.');
        }
        resolvedPath = resolvedPath.replace(':id', encodeURIComponent(pathParamId.trim()));
      }

      // Assemble query params
      const qp: Record<string, string> = {};
      queryParams.forEach((p) => {
        if (p.enabled && p.key.trim()) {
          qp[p.key.trim()] = p.value;
        }
      });

      const res = await executeApiExplorerRequest({
        method,
        path: resolvedPath,
        queryParams: qp,
        body: ['POST', 'PUT', 'PATCH'].includes(method) ? requestBody : undefined,
      });

      setExecutionResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution error');
    } finally {
      setIsExecuting(false);
    }
  };

  const formatRequestBody = () => {
    if (!requestBody.trim()) return;
    try {
      const parsed = JSON.parse(requestBody);
      setRequestBody(JSON.stringify(parsed, null, 2));
    } catch {
      setError('Invalid JSON in request body cannot be formatted.');
    }
  };

  const selectedRoute = REGISTERED_API_ROUTES.find((r) => r.id === selectedRouteId);

  return (
    <div className="space-y-6">
      {/* Header and Route Preset Selector */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 font-mono flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              INTERNAL API EXPLORER
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live debugging and interactive testing against backend controllers via Next.js proxy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500">Endpoint Preset:</span>
            <select
              value={selectedRouteId}
              onChange={(e) => handleRouteChange(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600 max-w-xs shadow-2xs"
            >
              {REGISTERED_API_ROUTES.map((route) => (
                <option key={route.id} value={route.id}>
                  [{route.method}] {route.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedRoute && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 flex items-center justify-between">
            <div>
              <span className="text-blue-600 font-semibold">{selectedRoute.name}: </span>
              <span className="text-slate-600">{selectedRoute.description}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200/70 text-slate-600 font-medium">
              Category: {selectedRoute.category}
            </span>
          </div>
        )}

        {/* Request Execution Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Method selector */}
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')}
            className={`font-mono text-xs font-bold px-3 py-2 rounded-lg border focus:outline-none shadow-2xs ${
              method === 'GET'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : method === 'POST'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : method === 'PUT' || method === 'PATCH'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          {/* Endpoint input */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono select-none">
              /api/backend
            </span>
            <input
              type="text"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              placeholder="/health"
              className="w-full pl-28 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
            />
          </div>

          {/* Execute button */}
          <button
            type="button"
            onClick={handleExecute}
            disabled={isExecuting}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 disabled:text-blue-400 text-white text-xs font-mono font-medium rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Send className={`w-3.5 h-3.5 ${isExecuting ? 'animate-pulse' : ''}`} />
            <span>{isExecuting ? 'Sending...' : 'Send Request'}</span>
          </button>
        </div>

        {/* Path parameter if route contains :id */}
        {customPath.includes(':id') && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-xs font-mono">
            <span className="text-amber-800 font-semibold">Path Parameter (:id):</span>
            <input
              type="text"
              value={pathParamId}
              onChange={(e) => setPathParamId(e.target.value)}
              placeholder="e.g. 64f81c9a4e..."
              className="flex-1 max-w-sm px-3 py-1 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
        )}
      </div>

      {/* Query Parameters & Request Body Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Parameters */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-800">
              <ListFilter className="w-3.5 h-3.5 text-blue-600" />
              QUERY PARAMETERS
            </div>
            <button
              type="button"
              onClick={addQueryParam}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-[11px] font-mono text-slate-700 transition-colors border border-slate-200 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3 text-slate-500" /> Add Param
            </button>
          </div>

          {queryParams.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs font-mono text-slate-500">
              No query parameters defined. Click &quot;Add Param&quot; to specify key-value query filters.
            </div>
          ) : (
            <div className="space-y-2">
              {queryParams.map((param, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={param.enabled}
                    onChange={(e) => updateQueryParam(index, 'enabled', e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-0"
                  />
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                    placeholder="Key (e.g. page)"
                    className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                    placeholder="Value (e.g. 1)"
                    className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeQueryParam(index)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Request Body (JSON) */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-800">
              <FileJson className="w-3.5 h-3.5 text-blue-600" />
              REQUEST BODY (JSON)
            </div>
            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <button
                type="button"
                onClick={formatRequestBody}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-[11px] font-mono text-slate-700 transition-colors border border-slate-200 cursor-pointer shadow-2xs"
              >
                Format JSON
              </button>
            )}
          </div>

          {!['POST', 'PUT', 'PATCH'].includes(method) ? (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs font-mono text-slate-500">
              HTTP {method} requests do not transmit a request body payload.
            </div>
          ) : (
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
              rows={5}
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600 leading-relaxed resize-none shadow-2xs"
            />
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Execution Error: </span>
            {error}
          </div>
        </div>
      )}

      {/* Response Display Panel */}
      {executionResult && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-semibold text-slate-700">
                RESPONSE STATUS:
              </span>
              <span
                className={`font-mono text-xs px-2.5 py-0.5 rounded font-bold ${
                  executionResult.status >= 200 && executionResult.status < 300
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : executionResult.status >= 400 && executionResult.status < 500
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {executionResult.status} {executionResult.statusText || 'OK'}
              </span>
              <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {executionResult.durationMs}ms
              </span>
            </div>

            {executionResult.requestId && (
              <div className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                Request ID: <span className="text-blue-600 font-semibold">{executionResult.requestId}</span>
              </div>
            )}
          </div>

          {/* Response Tabs (Body & Headers) */}
          <div className="space-y-4">
            <div>
              <div className="text-xs font-mono text-slate-600 mb-1.5 font-semibold">
                RESPONSE BODY
              </div>
              <DevJsonViewer data={executionResult.data} title="Parsed Response Data" />
            </div>

            <div>
              <div className="text-xs font-mono text-slate-600 mb-1.5 font-semibold">
                SANITIZED RESPONSE HEADERS
              </div>
              <DevJsonViewer
                data={executionResult.headers}
                title="Response Headers (Secrets Redacted)"
                maxHeight="max-h-48"
                defaultExpanded={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
