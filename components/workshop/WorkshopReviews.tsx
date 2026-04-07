interface Review {
  id: number;
  name: string;
  rating: number;
  text: string;
  createdAt: string | Date;
}

interface Props {
  reviews: Review[];
  categoryName: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-5 h-5 ${s <= rating ? 'text-[#c99706]' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function WorkshopReviews({ reviews, categoryName }: Props) {
  if (reviews.length === 0) return null;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section aria-labelledby="reviews-heading" className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 id="reviews-heading" className="text-2xl font-bold text-gray-900">
            What our guests say
          </h2>
          <p className="text-gray-600 mt-1">
            Reviews from people who attended a {categoryName} workshop
          </p>
        </div>

        {/* Average rating summary */}
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-5 py-3">
          <span className="text-4xl font-bold text-[#c99706]">{avgRating.toFixed(1)}</span>
          <div>
            <StarDisplay rating={Math.round(avgRating)} />
            <p className="text-xs text-gray-500 mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('nl-NL', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <StarDisplay rating={review.rating} />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{review.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
