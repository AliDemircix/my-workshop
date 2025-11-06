"use client";
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addMonths, format, startOfMonth } from 'date-fns';
import ReservationSidebar from './ReservationSidebar';
import { sanitizeHtml } from '@/lib/sanitize';

type Category = { id: number; name: string };
type CategoryWithMeta = { id: number; name: string; slug?: string | null; description?: string | null; imageUrl?: string | null; longDescription?: string | null };

export default function ReservationFlow() {
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const { data: categories } = useQuery<CategoryWithMeta[]>({
    queryKey: ['categories'],
    queryFn: async () => (await fetch('/api/categories')).json(),
  });

  // Select the first category by default when categories load
  useEffect(() => {
    if (!categoryId && categories && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const [viewDate, setViewDate] = useState<Date>(startOfMonth(new Date()));
  const { data: availability } = useQuery<any>({
    queryKey: ['availability', categoryId, viewDate.getMonth(), viewDate.getFullYear()],
    queryFn: async () =>
      categoryId == null
        ? null
        : (await fetch(`/api/availability?categoryId=${categoryId}&month=${viewDate.getMonth()}&year=${viewDate.getFullYear()}`)).json(),
    enabled: categoryId != null,
  });

  return (
    <div className="w-full">
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Left: Category info and image (3/4 width) */}
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
                      <img src={url} alt={cat?.name || 'Category image'} className="w-full h-full object-cover" />
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

        {/* Right: Booking sidebar (1/4 width) */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg border p-6 space-y-6 sticky top-6">
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-900">Choose Workshop Category</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-[#c99706] focus:border-transparent transition-all duration-200"
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

            {categoryId && (
              <ReservationSidebar
                availability={availability}
                viewDate={viewDate}
                setViewDate={(fn) => setViewDate(fn)}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
