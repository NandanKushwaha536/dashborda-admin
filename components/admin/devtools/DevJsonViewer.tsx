'use client';

import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { redactObject } from '@/lib/devtools/redact';

interface DevJsonViewerProps {
  data: unknown;
  title?: string;
  maxHeight?: string;
  defaultExpanded?: boolean;
}

export function DevJsonViewer({
  data,
  title,
  maxHeight = 'max-h-96',
  defaultExpanded = true,
}: DevJsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [filter, setFilter] = useState('');

  const sanitized = redactObject(data);
  const formattedJson = typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Filter lines if search query is provided
  const lines = formattedJson.split('\n');
  const displayContent =
    filter.trim() === ''
      ? formattedJson
      : lines
          .filter((line) => line.toLowerCase().includes(filter.toLowerCase()))
          .join('\n');

  return (
    <div className="rounded-lg border border-slate-200 bg-white font-mono text-xs overflow-hidden shadow-2xs">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 text-slate-600 select-none">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 hover:text-slate-900 transition-colors cursor-pointer"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <span className="font-semibold text-slate-800">
            {title || 'Payload / Response Body'}
          </span>
          <span className="text-[10px] text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded font-medium">
            {lines.length} lines
          </span>
        </div>

        <div className="flex items-center gap-2">
          {lines.length > 15 && expanded && (
            <div className="relative">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter keys/values..."
                className="w-36 px-2 py-0.5 pl-6 bg-white text-slate-800 border border-slate-200 rounded text-[11px] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400"
              />
              <Search className="w-3 h-3 text-slate-400 absolute left-1.5 top-1.5" />
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded text-[11px] font-medium transition-colors border border-slate-200 cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      {expanded && (
        <div className={`p-3 overflow-auto ${maxHeight} text-slate-800 bg-slate-50/30 leading-relaxed`}>
          <pre className="whitespace-pre font-mono text-[11px]">
            {displayContent || '<empty payload>'}
          </pre>
        </div>
      )}
    </div>
  );
}
