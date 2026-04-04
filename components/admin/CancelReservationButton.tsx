"use client";
import { useState, useTransition } from 'react';

type Props = {
  action: (formData: FormData) => Promise<void>;
  reservationId: number;
  page: number;
  perPage: number;
  sort: string;
  status: string;
  categoryId: string;
  q: string;
  disabled?: boolean;
};

export default function CancelReservationButton({ action, reservationId, page, perPage, sort, status, categoryId, q, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    const formData = new FormData();
    formData.set('id', String(reservationId));
    formData.set('page', String(page));
    formData.set('perPage', String(perPage));
    formData.set('sort', sort);
    formData.set('status', status);
    formData.set('categoryId', categoryId);
    formData.set('q', q);
    setOpen(false);
    startTransition(() => action(formData));
  };

  return (
    <>
      <button
        type="button"
        className="text-red-600 underline disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={disabled || isPending}
        onClick={() => setOpen(true)}
      >
        {isPending ? 'Cancelling…' : 'Cancel & Refund'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Confirm cancellation">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Cancel & Refund</h2>
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel this reservation? If the payment was captured, a refund will be issued automatically.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded border border-gray-300 text-sm hover:bg-gray-50"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 rounded bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
              >
                Yes, Cancel & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
