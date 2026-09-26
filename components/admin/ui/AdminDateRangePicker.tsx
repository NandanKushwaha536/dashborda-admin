'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';

export interface AdminDateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  label?: string;
  presets?: boolean;
  className?: string;
  id?: string;
}

export function AdminDateRangePicker({
  startDate,
  endDate,
  onChange,
  label,
  presets = true,
  className = '',
  id = 'admin-date-range-picker',
}: AdminDateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<string>('all');

  // Sync active preset when props change
  useEffect(() => {
    if (!startDate && !endDate) {
      setActivePreset('all');
    }
  }, [startDate, endDate]);

  const handlePresetSelect = (preset: string) => {
    setActivePreset(preset);
    const now = new Date();
    const toDateString = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const todayStr = toDateString(now);
      onChange(todayStr, todayStr);
    } else if (preset === 'last7') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      onChange(toDateString(past), toDateString(now));
    } else if (preset === 'last30') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      onChange(toDateString(past), toDateString(now));
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      onChange(toDateString(firstDay), toDateString(now));
    } else if (preset === 'all') {
      onChange('', '');
    }
  };

  const handleClear = () => {
    setActivePreset('all');
    onChange('', '');
  };

  const hasValue = Boolean(startDate || endDate);

  return (
    <div id={id} className={`flex flex-wrap items-center gap-2 ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-slate-700 select-none">
          {label}:
        </span>
      )}

      {/* Date Inputs Box */}
      <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs hover:border-slate-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
        <Calendar className="w-4 h-4 text-blue-600 shrink-0 select-none" />

        {/* Start Date */}
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={`${id}-from`}
            className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider select-none cursor-pointer"
          >
            From
          </label>
          <input
            id={`${id}-from`}
            type="date"
            value={startDate}
            onChange={(e) => {
              setActivePreset('custom');
              onChange(e.target.value, endDate);
            }}
            aria-label="Start placement date"
            className="bg-transparent text-xs text-slate-900 font-medium outline-hidden cursor-pointer focus:outline-none"
          />
        </div>

        <span className="text-slate-300 font-light select-none">→</span>

        {/* End Date */}
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={`${id}-to`}
            className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider select-none cursor-pointer"
          >
            To
          </label>
          <input
            id={`${id}-to`}
            type="date"
            value={endDate}
            onChange={(e) => {
              setActivePreset('custom');
              onChange(startDate, e.target.value);
            }}
            aria-label="End placement date"
            className="bg-transparent text-xs text-slate-900 font-medium outline-hidden cursor-pointer focus:outline-none"
          />
        </div>

        {/* Clear Button */}
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
            title="Clear date range"
            aria-label="Clear date range"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Preset Buttons */}
      {presets && (
        <div className="flex items-center gap-1">
          {[
            { id: 'today', label: 'Today' },
            { id: 'last7', label: '7D' },
            { id: 'last30', label: '30D' },
            { id: 'thisMonth', label: 'This Month' },
          ].map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-1 text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer select-none"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
