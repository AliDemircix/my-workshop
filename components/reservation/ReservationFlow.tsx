"use client";
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addMonths, format, startOfMonth } from 'date-fns';
import Slider from '@/components/Slider';
import { slugify } from '@/lib/slug';
import ReservationSidebar from './ReservationSidebar';

type Category = { id: number; name: string };
type CategoryWithMeta = { id: number; name: string; slug?: string | null; description?: string | null; imageUrl?: string | null; longDescription?: string | null };
type SiteSettings = { sliderImages?: string[] };

export default function ReservationFlow() {
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedTimeslotId, setSelectedTimeslotId] = useState<number | null>(null);

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

  const dates = useMemo(() => (availability ? Object.keys(availability) : []), [availability]);
  const times = selectedDateKey && availability ? availability[selectedDateKey]?.times ?? [] : [];

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ['siteSettings'],
    queryFn: async () => {
      const s = await fetch('/api/settings');
      if (!s.ok) return {} as SiteSettings;
      return s.json();
    },
  });

  const sliderImages = settings?.sliderImages ?? [];

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Image + details (2/3 width) */}
        <div className="md:col-span-2 space-y-6">
          {/* Category image or placeholder */}
          {categoryId && categories && (
            (() => {
              const cat = categories.find((c: CategoryWithMeta) => c.id === categoryId);
              const url = cat?.imageUrl;
              const desc = cat?.description;
              return (
                <div className="space-y-3">
                  <div className="w-full aspect-[16/9] rounded border bg-gray-100 flex items-center justify-center overflow-hidden laser-frame">
                    {/* Laser edges */}
                    <span aria-hidden className="edge top laser-edge-h" />
                    <span aria-hidden className="edge right laser-edge-v" />
                    <span aria-hidden className="edge bottom laser-edge-h" />
                    <span aria-hidden className="edge left laser-edge-v" />
                    {url ? (
                      <img src={url} alt={cat?.name || 'Category image'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-gray-500">Workshop image</div>
                    )}
                  </div>
                  {desc && (
                    <div className="prose prose-sm prose-slate max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: desc }} />
                  )}
                </div>
              );
            })()
          )}
        </div>

        {/* Right: Sidebar with category, calendar, timeslots, and details (1/3 width) */}
        <aside className="md:col-span-1 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Select a workshop you want to join</label>
            <select
              className="w-full border rounded px-3 py-2 bg-[#c99706] text-white"
              value={String(categoryId ?? '')}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : null;
                setCategoryId(v);
                setSelectedDateKey(null);
                setSelectedTimeslotId(null);
                setViewDate(startOfMonth(new Date()));
              }}
            >
              <option value="">Select a category</option>
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
        </aside>
      </div>

      {/* Hero Section for Workshops */}
      {categories && categories.length > 0 && (
        <section className="space-y-8 mt-16 mb-8">
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-bold text-gray-900">Our Workshops</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Discover our creative workshops designed to inspire and educate. Choose from our curated selection of hands-on experiences.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {categories.map((c) => {
              const url = c.imageUrl;
              const short = c.description;
              const slug = c.slug || slugify(c.name);
              return (
                <article key={c.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100">
                  <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {url ? (
                      <img src={url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-gray-900 group-hover:text-[#c99706] transition-colors duration-300">{c.name}</h4>
                      {short ? (
                        <div className="prose prose-sm prose-gray max-w-none text-gray-600 line-clamp-3" dangerouslySetInnerHTML={{ __html: short }} />
                      ) : (
                        <p className="text-gray-600">Discover this amazing workshop experience.</p>
                      )}
                    </div>
                    <div className="pt-2">
                      <a 
                        href={`/workshops/${slug}`} 
                        className="inline-flex items-center gap-2 bg-[#c99706] text-white rounded-xl px-6 py-3 font-semibold hover:bg-[#b8860b] transition-all duration-300 hover:shadow-lg transform hover:scale-105 group/btn"
                      >
                        <span>Look workshop</span>
                        <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                      <svg className="w-5 h-5 text-[#c99706]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {categoryId && sliderImages.length > 0 && (
        <section className="mt-8 pt-8 border-t border-gray-200">
          <div className="text-center space-y-4 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900">Some of our products</h3>
            <p className="text-gray-600 max-w-xl mx-auto">Explore the beautiful products and materials we use in our workshops</p>
          </div>
          <Slider images={sliderImages} />
        </section>
      )}
    </div>
  );
}

// Calendar and ReserveForm moved to shared components
