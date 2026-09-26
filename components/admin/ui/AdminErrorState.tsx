import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { AdminButton } from './AdminButton';

export interface AdminErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function AdminErrorState({
  title = 'Failed to load data',
  message = 'An error occurred while connecting to the backend server. Please verify your connection or try again.',
  onRetry,
  className = '',
}: AdminErrorStateProps) {
  return (
    <div
      className={`p-8 border border-red-200 bg-red-50/50 rounded-xl flex flex-col items-center justify-center text-center max-w-md mx-auto ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-600 mb-4">{message}</p>
      {onRetry && (
        <AdminButton
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Retry Request
        </AdminButton>
      )}
    </div>
  );
}
