"use client";

import Link from 'next/link';

interface Review {
  id: number;
  name: string;
  rating: number;
  text: string;
  approved: boolean;
  createdAt: string;
  category: { id: number; name: string };
  reservation: {
    id: number;
    name: string;
    email: string;
    session: { date: string };
  };
}

interface Props {
  reviews: Review[];
  pendingCount: number;
  approvedCount: number;
  currentFilter?: string;
  approveAction: (formData: FormData) => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-4 h-4 ${s <= rating ? 'text-[#c99706]' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function AdminReviewsClient({
  reviews,
  pendingCount,
  approvedCount,
  currentFilter,
  approveAction,
  rejectAction,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/reviews"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !currentFilter ? 'bg-[#c99706] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({pendingCount + approvedCount})
        </Link>
        <Link
          href="/admin/reviews?filter=pending"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            currentFilter === 'pending' ? 'bg-[#c99706] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending ({pendingCount})
        </Link>
        <Link
          href="/admin/reviews?filter=approved"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            currentFilter === 'approved' ? 'bg-[#c99706] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Approved ({approvedCount})
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center space-y-2">
          <p className="text-gray-600 font-medium">No reviews found</p>
          <p className="text-sm text-gray-400">Customer reviews will appear here once submitted.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`rounded-lg border bg-white p-5 space-y-4 ${
                r.approved ? 'border-green-200' : 'border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-gray-900">{r.name}</p>
                    <StarDisplay rating={r.rating} />
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      r.approved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {r.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {r.category.name} &middot; Session{' '}
                    {new Date(r.reservation.session.date).toLocaleDateString('nl-NL')} &middot;
                    Booking #{r.reservation.id} ({r.reservation.email})
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  Submitted {new Date(r.createdAt).toLocaleDateString('nl-NL', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                  })}
                </p>
              </div>

              <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.text}</p>

              <div className="flex items-center gap-3 justify-end">
                {!r.approved && (
                  <form action={approveAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="text-sm font-medium text-green-600 hover:text-green-800 border border-green-300 hover:border-green-500 px-4 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                    >
                      Approve
                    </button>
                  </form>
                )}
                <form action={rejectAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-4 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    {r.approved ? 'Remove' : 'Reject'}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
