"use client";
import { useEffect } from 'react';

export default function ConfirmDialog({ open, title = 'Confirm', message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, loading = false }: {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-sm rounded-lg bg-white shadow-xl border border-gray-200">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <div className="px-4 py-4 text-sm text-gray-700">
          {message}
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Working…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
