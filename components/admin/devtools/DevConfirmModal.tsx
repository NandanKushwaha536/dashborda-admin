'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface DevConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  actionButtonText: string;
  requiredConfirmationText?: string;
  isDestructive?: boolean;
}

export function DevConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actionButtonText,
  requiredConfirmationText,
  isDestructive = true,
}: DevConfirmModalProps) {
  const [typedConfirm, setTypedConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const canConfirm = !requiredConfirmationText || typedConfirm.trim() === requiredConfirmationText;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-2xl text-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-500 font-mono">BACKEND AUTHORIZATION REQUIRED</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-semibold">Caution:</span> {description}
            </div>
          </div>

          {requiredConfirmationText && (
            <div className="space-y-2">
              <label className="block text-xs text-slate-700 font-medium">
                Type <span className="font-mono text-rose-600 font-bold">{requiredConfirmationText}</span> to confirm:
              </label>
              <input
                type="text"
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value)}
                placeholder={requiredConfirmationText}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-mono">
              Error: {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isSubmitting}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 text-white disabled:bg-rose-200 disabled:text-rose-400'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-200 disabled:text-blue-400'
            }`}
          >
            {isSubmitting ? 'Executing...' : actionButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
