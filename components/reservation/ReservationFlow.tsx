"use client";
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parseISO, startOfMonth } from 'date-fns';
import ReservationSidebar from './ReservationSidebar';
import { sanitizeHtml } from '@/lib/sanitize';

type Category = { id: number; name: string };
type CategoryWithMeta = { id: number; name: string; slug?: string | null; description?: string | null; imageUrl?: string | null; longDescription?: string | null };

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export default function ReservationFlow({
  initialCategoryId,
  initialDate,
}: {
  initialCategoryId?: number;
  initialDate?: string;
}) {
  const [categoryId, setCategoryId] = useState<number | null>(initialCategoryId ?? null);

  const { data: categories, isLoading: categoriesLoading } = useQuery<CategoryWithMeta[]>({
    queryKey: ['categories'],
    queryFn: async () => (await fetch('/api/categories')).json(),
  });

  useEffect(() => {
    if (!initialCategoryId && !categoryId && categories && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId, initialCategoryId]);

  const initialViewDate = initialDate ? startOfMonth(parseISO(initialDate)) : startOfMonth(new Date());
  const [viewDate, setViewDate] = useState<Date>(initialViewDate);

  const initialDateKey = initialDate ?? null;

  const { data: availability, isLoading: availabilityLoading } = useQuery<any>({
    queryKey: ['availability', categoryId, viewDate.getMonth(), viewDate.getFullYear()],
    queryFn: async () =>
      categoryId == null
        ? null
        : (await fetch(`/api/availability?categoryId=${categoryId}&month=${viewDate.getMonth()}&year=${viewDate.getFullYear()}`)).json(),
    enabled: categoryId != null,
  });

  // Derive current step for indicator
  const step = !categoryId ? 1 : !availability ? 2 : 3;

  if (categoriesLoading) {
    return (
      <div className="w-full">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <SkeletonBlock className="w-full aspect-[16/9]" />
            <SkeletonBlock className="h-6 w-3/4" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg border p-6 space-y-4">
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!categoriesLoading && categories && categories.length === 0) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-700">No workshops available yet</p>
          <p className="text-sm text-gray-500 mt-1">Check back soon — new sessions are added regularly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm" aria-label="Booking steps">
        {[
          { n: 1, label: 'Choose workshop' },
          { n: 2, label: 'Pick date & time' },
          { n: 3, label: 'Your details' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-gray-300" aria-hidden="true" />}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > s.n
                    ? 'bg-[#c99706] text-white'
                    : step === s.n
                    ? 'bg-[#c99706] text-white ring-2 ring-[#c99706]/30'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s.n ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : s.n}
              </span>
              <span className={`hidden sm:block ${step === s.n ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: Category info and image (3/5 width) */}
        <div className="lg:col-span-3 space-y-6">
          {categoryId && categories && (
            (() => {
              const cat = categories.find((c: CategoryWithMeta) => c.id === categoryId);
              const url = cat?.imageUrl;
              const desc = cat?.description;
              return (
                <div className="space-y-4">
                  <div className="w-full aspect-[16/9] rounded-lg border bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                    {url ? (
                      <img src={url} alt={cat?.name || 'Category image'} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-500 space-y-2">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">Workshop image</span>
                      </div>
                    )}
                  </div>

                  {cat && (
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">{cat.name}</h2>
                      {desc && (
                        <div className="prose prose-sm prose-slate max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizeHtml(desc) }} />
                      )}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>

        {/* Right: Booking sidebar (2/5 width) */}
        <aside className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg border p-6 space-y-6 sticky top-6">
            <div>
              <label htmlFor="workshop-select" className="block text-sm font-semibold mb-3 text-gray-900">Choose Workshop Category</label>
              <select
                id="workshop-select"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-[#c99706] focus:border-transparent focus-visible:outline-none transition-all duration-200"
                value={String(categoryId ?? '')}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null;
                  setCategoryId(v);
                  setViewDate(startOfMonth(new Date()));
                }}
              >
                <option value="">Select a workshop...</option>
                {categories?.map((c: Category) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {categoryId && availabilityLoading && (
              <div className="space-y-3">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-48 w-full" />
                <SkeletonBlock className="h-4 w-32" />
              </div>
            )}

            {categoryId && !availabilityLoading && (
              <ReservationSidebar
                availability={availability}
                viewDate={viewDate}
                setViewDate={(fn) => setViewDate(fn)}
                initialDateKey={initialDateKey}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
