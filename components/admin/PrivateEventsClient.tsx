"use client";

import Link from 'next/link';

interface PrivateEventRequest {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  groupSize: number;
  preferredDates: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  category: { id: number; name: string } | null;
}

interface Props {
  requests: PrivateEventRequest[];
  countMap: Record<string, number>;
  currentFilter?: string;
  updateStatusAction: (formData: FormData) => Promise<void>;
}

const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
  NEW: { label: 'New', classes: 'bg-blue-50 text-blue-700' },
  IN_PROGRESS: { label: 'In Progress', classes: 'bg-amber-50 text-amber-700' },
  CLOSED: { label: 'Closed', classes: 'bg-gray-100 text-gray-600' },
};

const NEXT_STATUS: Record<string, string> = {
  NEW: 'IN_PROGRESS',
  IN_PROGRESS: 'CLOSED',
  CLOSED: 'NEW',
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  NEW: 'Mark In Progress',
  IN_PROGRESS: 'Mark Closed',
  CLOSED: 'Reopen',
};

export default function PrivateEventsClient({ requests, countMap, currentFilter, updateStatusAction }: Props) {
  const total = Object.values(countMap).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/private-events"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !currentFilter ? 'bg-[#c99706] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({total})
        </Link>
        {['NEW', 'IN_PROGRESS', 'CLOSED'].map((s) => (
          <Link
            key={s}
            href={`/admin/private-events?status=${s}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentFilter === s ? 'bg-[#c99706] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {STATUS_LABELS[s].label} ({countMap[s] ?? 0})
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center space-y-2">
          <p className="text-gray-600 font-medium">No inquiries found</p>
          <p className="text-sm text-gray-400">Private event inquiries will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const s = STATUS_LABELS[r.status] ?? { label: r.status, classes: 'bg-gray-100 text-gray-600' };
            const nextStatus = NEXT_STATUS[r.status];
            const nextLabel = NEXT_STATUS_LABEL[r.status];

            return (
              <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-gray-900 text-base">{r.name}</p>
                    <p className="text-sm text-gray-600">{r.email}</p>
                    {r.phone && <p className="text-sm text-gray-500">{r.phone}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${s.classes}`}>
                      {s.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Group size</p>
                    <p className="text-gray-900 font-semibold">{r.groupSize} people</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Workshop</p>
                    <p className="text-gray-900">{r.category?.name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preferred dates</p>
                    <p className="text-gray-900">{r.preferredDates ?? '—'}</p>
                  </div>
                </div>

                {r.message && (
                  <div className="rounded bg-gray-50 border border-gray-100 px-3 py-2 text-sm text-gray-700">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Message</p>
                    <p className="whitespace-pre-wrap">{r.message}</p>
                  </div>
                )}

                <form action={updateStatusAction} className="space-y-3">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value={nextStatus} />
                  {nextStatus === 'CLOSED' && (
                    <textarea
                      name="closingMessage"
                      rows={2}
                      placeholder="Optional message to customer (included in closing email)"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c99706] resize-none"
                    />
                  )}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="text-sm font-medium text-[#c99706] hover:text-[#b3860a] border border-[#c99706] hover:border-[#b3860a] px-4 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
                    >
                      {nextLabel}
                    </button>
                  </div>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
