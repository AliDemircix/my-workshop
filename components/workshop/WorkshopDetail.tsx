"use client";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth } from 'date-fns';
import Link from 'next/link';
import ReservationSidebar from '@/components/reservation/ReservationSidebar';
import { sanitizeHtml } from '@/lib/sanitize';

type Category = {
  id: number;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
  longDescription?: string | null;
  slug?: string | null;
};

export default function WorkshopDetail({ category }: { category: Category }) {
  const categoryId = category.id;
  const [viewDate, setViewDate] = useState<Date>(startOfMonth(new Date()));
  const { data: availability } = useQuery<any>({
    queryKey: ['availability', categoryId, viewDate.getMonth(), viewDate.getFullYear()],
    queryFn: async () => (await fetch(`/api/availability?categoryId=${categoryId}&month=${viewDate.getMonth()}&year=${viewDate.getFullYear()}`)).json(),
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-500">
        <Link href="/" className="hover:text-[#c99706] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] rounded">
          Home
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <Link href="/reserve" className="hover:text-[#c99706] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] rounded">
          Workshops
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-gray-900 font-medium" aria-current="page">{category.name}</span>
      </nav>

      {/* Above-the-fold heading + Book CTA */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        <Link
          href={`/reserve?categoryId=${categoryId}`}
          className="shrink-0 bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-2"
        >
          Book Now
        </Link>
      </div>

      {/* Two-column layout — stacks on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: image + description */}
        <div className="lg:col-span-2 space-y-6">
          {category.imageUrl && (
            <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <img
                src={category.imageUrl}
                alt={(category as any).imageAlt || category.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">About This Workshop</h2>
            {(category.longDescription || category.description) ? (
              <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(category.longDescription || category.description || '') }} />
            ) : (
              <p className="text-gray-600">No description available for this workshop.</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Link
              href={`/reserve?categoryId=${categoryId}`}
              className="inline-flex items-center gap-2 bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-2"
            >
              Book This Workshop
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Right: Calendar & reservation sidebar */}
        <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Check Availability</h3>
            <ReservationSidebar availability={availability} viewDate={viewDate} setViewDate={(fn) => setViewDate(fn)} />
          </div>
        </aside>
      </div>
    </div>
  );
}
