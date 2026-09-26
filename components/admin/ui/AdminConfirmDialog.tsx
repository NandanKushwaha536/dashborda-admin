'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { AdminModal } from './AdminModal';
import { AdminButton } from './AdminButton';

export interface AdminConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  isLoading = false,
}: AdminConfirmDialogProps) {
  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          {isDangerous && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{title}</span>
        </div>
      }
      maxWidth="sm"
      footer={
        <>
          <AdminButton variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </AdminButton>
          <AdminButton
            variant={isDangerous ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </AdminButton>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </AdminModal>
  );
}
