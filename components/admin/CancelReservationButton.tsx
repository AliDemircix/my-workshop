"use client";
import { useState } from 'react';

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

  return (
    <>
      <button
        type="button"
        className="text-red-600 underline disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Cancel & Refund
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
              <form action={action}>
                <input type="hidden" name="id" value={reservationId} />
                <input type="hidden" name="page" value={page} />
                <input type="hidden" name="perPage" value={perPage} />
                <input type="hidden" name="sort" value={sort} />
                <input type="hidden" name="status" value={status} />
                <input type="hidden" name="categoryId" value={categoryId} />
                <input type="hidden" name="q" value={q} />
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                >
                  Yes, Cancel & Refund
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
