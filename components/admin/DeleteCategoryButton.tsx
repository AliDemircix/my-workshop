"use client";
import { useState, useCallback } from 'react';
import ConfirmDialog from './ConfirmDialog';

export default function DeleteCategoryButton({ id, action, disabled, title }: { id: number; action: (formData: FormData) => void; disabled?: boolean; title?: string }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = useCallback(async () => {
    if (disabled || submitting) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set('id', String(id));
      await action(fd);
    } finally {
      setSubmitting(false);
      setOpen(false);
    }
  }, [id, action, disabled, submitting]);

  return (
    <>
      <button
        type="button"
        className="text-red-600 hover:text-red-800 inline-flex items-center gap-1 disabled:opacity-50"
        title={title}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M8.5 3a1.5 1.5 0 00-1.415 1H5a.75.75 0 000 1.5h10a.75.75 0 000-1.5h-2.085A1.5 1.5 0 0011.5 3h-3zM5.5 7.25a.75.75 0 011.5 0v7a.75.75 0 01-1.5 0v-7zm4 0a.75.75 0 011.5 0v7a.75.75 0 01-1.5 0v-7zm4 0a.75.75 0 011.5 0v7a.75.75 0 01-1.5 0v-7z" clipRule="evenodd" />
          <path d="M6.5 6.5h7l-.64 9.135A2 2 0 0110.87 17.5H9.13a2 2 0 01-1.99-1.865L6.5 6.5z" />
        </svg>
        <span className="sr-only">Delete</span>
      </button>
      <ConfirmDialog
        open={open}
        title="Delete category"
        message="Are you sure you want to delete this category? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
        loading={submitting}
      />
    </>
  );
}
