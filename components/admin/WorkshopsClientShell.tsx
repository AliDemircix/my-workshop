"use client";
import { useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { formatEUR } from '@/lib/currency';
import DeleteSessionButton from '@/components/admin/DeleteSessionButton';
import DuplicateSessionButton from '@/components/admin/DuplicateSessionButton';
import AddWorkshopDialog, { type PrefillSession } from '@/components/admin/AddWorkshopDialog';

export type SessionRow = {
  id: number;
  categoryId: number;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  priceCents: number;
  category: { name: string };
  _count?: { reservations: number };
  reservations?: { quantity: number; status: string }[];
};

type Props = {
  sessions: SessionRow[];
  categories: { id: number; name: string }[];
  totalCount: number;
  action: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
  defaultCategoryId?: number;
  page: number;
};

export default function WorkshopsClientShell({
  sessions,
  categories,
  totalCount,
  action,
  deleteAction,
  defaultCategoryId,
  page,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefill, setPrefill] = useState<PrefillSession | null>(null);

  function openAddDialog() {
    setPrefill(null);
    setDialogOpen(true);
  }

  function openDuplicateDialog(data: PrefillSession) {
    setPrefill(data);
    setDialogOpen(true);
  }

  return (
    <>
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workshops</h1>
          <p className="text-gray-600 mt-1">
            {totalCount} session{totalCount === 1 ? '' : 's'} total
          </p>
        </div>
        <button
          type="button"
          onClick={openAddDialog}
          className="bg-gray-900 text-white rounded px-4 py-2 hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
        >
          Add Workshop
        </button>
      </div>

      {/* Single dialog instance */}
      <AddWorkshopDialog
        action={action}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        prefill={prefill}
        onPrefillConsumed={() => setPrefill(null)}
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-md overflow-hidden">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm">
              <th className="px-3 py-2 border-b">Category</th>
              <th className="px-3 py-2 border-b">Date</th>
              <th className="px-3 py-2 border-b">Time</th>
              <th className="px-3 py-2 border-b">Capacity</th>
              <th className="px-3 py-2 border-b">Price</th>
              <th className="px-3 py-2 border-b">Status</th>
              <th className="px-3 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sessions.map((s) => {
              const now = new Date();
              const isFinished = new Date(s.endTime) < now;
              const reservedSeats = (s.reservations || []).reduce(
                (sum, r) =>
                  r.status !== 'CANCELED' && r.status !== 'REFUNDED'
                    ? sum + r.quantity
                    : sum,
                0
              );
              const isOverbooked = reservedSeats > s.capacity;
              const isFull = reservedSeats >= s.capacity;
              const hasRes = (s._count?.reservations || 0) > 0;

              const statusLabel = isOverbooked
                ? 'Overbooked'
                : isFinished
                ? 'Finished'
                : isFull
                ? 'Full'
                : 'Available';
              const statusCls = isOverbooked
                ? 'bg-red-100 text-red-800'
                : isFinished
                ? 'bg-slate-100 text-slate-600'
                : isFull
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800';

              const deleteTitle = isFinished
                ? 'Cannot delete a finished workshop'
                : hasRes
                ? 'Cannot delete session with reservations'
                : 'Delete session';

              return (
                <tr
                  key={s.id}
                  className={`text-sm hover:bg-gray-50 ${isFinished ? 'bg-gray-100' : ''}`}
                >
                  <td className="px-3 py-2 max-w-[10rem]">
                    <Link
                      href={`/admin/workshops/${s.id}/details`}
                      className="text-blue-600 hover:text-blue-800 underline block truncate"
                      title={s.category.name}
                    >
                      {s.category.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{format(new Date(s.date), 'dd MMM yyyy')}</td>
                  <td className="px-3 py-2">
                    {format(new Date(s.startTime), 'HH:mm')}–{format(new Date(s.endTime), 'HH:mm')}
                  </td>
                  <td className="px-3 py-2">{reservedSeats}/{s.capacity}</td>
                  <td className="px-3 py-2">{formatEUR(s.priceCents)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusCls}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {/* Edit */}
                      {isFinished ? (
                        <span
                          className="inline-flex flex-col items-center opacity-50 cursor-not-allowed text-gray-400 px-1"
                          title="Cannot edit a finished workshop"
                          aria-disabled="true"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                            <path d="M5.433 13.917l-1.354.339a.75.75 0 01-.904-.904l.339-1.354a2.25 2.25 0 01.592-1.09l6.82-6.82a2.25 2.25 0 113.182 3.182l-6.82 6.82a2.25 2.25 0 01-1.09.592z" />
                            <path d="M3.25 15.25h13.5a.75.75 0 010 1.5H3.25a.75.75 0 010-1.5z" />
                          </svg>
                          <span className="text-[10px] text-gray-500 block text-center">Edit</span>
                        </span>
                      ) : (
                        <Link
                          href={`/admin/workshops/${s.id}`}
                          className="text-blue-600 hover:text-blue-800 inline-flex flex-col items-center px-1"
                          title="Edit session"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                            <path d="M5.433 13.917l-1.354.339a.75.75 0 01-.904-.904l.339-1.354a2.25 2.25 0 01.592-1.09l6.82-6.82a2.25 2.25 0 113.182 3.182l-6.82 6.82a2.25 2.25 0 01-1.09.592z" />
                            <path d="M3.25 15.25h13.5a.75.75 0 010 1.5H3.25a.75.75 0 010-1.5z" />
                          </svg>
                          <span className="text-[10px] text-gray-500 block text-center">Edit</span>
                        </Link>
                      )}

                      {/* Duplicate */}
                      {isFinished ? (
                        <span
                          className="inline-flex flex-col items-center opacity-40 cursor-not-allowed text-gray-400 px-1"
                          title="Cannot duplicate a finished session"
                          aria-disabled="true"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                            <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                          </svg>
                          <span className="text-[10px] text-gray-500 block text-center">Copy</span>
                        </span>
                      ) : (
                        <DuplicateSessionButton
                          session={{
                            categoryId: s.categoryId,
                            startTime: s.startTime,
                            endTime: s.endTime,
                            capacity: s.capacity,
                            priceCents: s.priceCents,
                          }}
                          onDuplicate={openDuplicateDialog}
                        />
                      )}

                      {/* Divider */}
                      <span className="w-px h-6 bg-gray-200 mx-1" />

                      {/* Delete */}
                      <DeleteSessionButton
                        id={s.id}
                        action={deleteAction}
                        disabled={isFinished || hasRes}
                        title={deleteTitle}
                        page={page}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
