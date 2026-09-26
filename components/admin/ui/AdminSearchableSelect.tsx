'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
}

export interface AdminSearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  className?: string;
  emptyMessage?: string;
  id?: string;
}

export const AdminSearchableSelect: React.FC<AdminSearchableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Type to search...',
  error,
  helperText,
  disabled = false,
  required = false,
  clearable = false,
  className = '',
  emptyMessage = 'No options match your search',
  id,
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(term)) ||
        (opt.badge && opt.badge.toLowerCase().includes(term))
    );
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className={`relative w-full space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left text-xs transition-all disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
          error
            ? 'border-red-400 ring-1 ring-red-400'
            : isOpen
              ? 'border-blue-500 ring-2 ring-blue-100'
              : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <span className="min-w-0 flex-1 truncate">
          {selectedOption ? (
            <span className="flex items-center gap-1.5">
              <span className="font-medium text-slate-900">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[11px] text-slate-400">({selectedOption.sublabel})</span>
              )}
              {selectedOption.badge && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                  {selectedOption.badge}
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>

        <span className="flex shrink-0 items-center gap-1">
          {clearable && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
          <div className="border-b border-slate-100 p-2">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <ul role="listbox" className="max-h-48 overflow-y-auto p-1 text-xs">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-3 text-center text-xs text-slate-400">{emptyMessage}</li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    className={`flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 transition-colors ${
                      option.disabled
                        ? 'cursor-not-allowed opacity-40'
                        : isSelected
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{option.label}</span>
                        {option.badge && (
                          <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-semibold text-slate-500">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {option.sublabel && (
                        <p className="truncate text-[10px] text-slate-400">{option.sublabel}</p>
                      )}
                    </div>
                    {isSelected && <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-blue-600" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {error ? (
        <p className="text-[10px] font-medium text-red-600">{error}</p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};
