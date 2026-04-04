"use client";
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth } from 'date-fns';
import Link from 'next/link';
import ReservationSidebar from '@/components/reservation/ReservationSidebar';
import { sanitizeHtml } from '@/lib/sanitize';
import { useTranslations } from 'next-intl';

type Photo = { id: number; url: string };

type Category = {
  id: number;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
  longDescription?: string | null;
  slug?: string | null;
  photos?: Photo[];
};

export default function WorkshopDetail({ category }: { category: Category }) {
  const t = useTranslations('workshop');
  const tn = useTranslations('nav');
  const categoryId = category.id;
  const [viewDate, setViewDate] = useState<Date>(startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedTimeslotId, setSelectedTimeslotId] = useState<number | null>(null);
  const photos = category.photos ?? [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const prev = () => setLightboxIndex((i) => (i! + photos.length - 1) % photos.length);
  const next = () => setLightboxIndex((i) => (i! + 1) % photos.length);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxIndex]);
  const { data: availability } = useQuery<any>({
    queryKey: ['availability', categoryId, viewDate.getMonth(), viewDate.getFullYear()],
    queryFn: async () => (await fetch(`/api/availability?categoryId=${categoryId}&month=${viewDate.getMonth()}&year=${viewDate.getFullYear()}`)).json(),
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-500">
        <Link href="/" className="hover:text-[#c99706] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] rounded">
          {tn('home')}
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <Link href="/reserve" className="hover:text-[#c99706] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] rounded">
          {t('breadcrumbWorkshops')}
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-gray-900 font-medium" aria-current="page">{category.name}</span>
      </nav>

      {/* Above-the-fold heading */}
      <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>

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
            <h2 className="text-xl font-semibold text-gray-900">{t('about')}</h2>
            {(category.longDescription || category.description) ? (
              <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(category.longDescription || category.description || '') }} />
            ) : (
              <p className="text-gray-600">{t('noDescription')}</p>
            )}
          </div>

        </div>

        {/* Right: Calendar & reservation sidebar */}
        <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-4">{t('checkAvailability')}</h3>
            <ReservationSidebar
              availability={availability}
              viewDate={viewDate}
              setViewDate={(fn) => setViewDate(fn)}
              selectedDateKey={selectedDateKey}
              setSelectedDateKey={setSelectedDateKey}
              selectedTimeslotId={selectedTimeslotId}
              setSelectedTimeslotId={setSelectedTimeslotId}
            />
          </div>
        </aside>
      </div>

      {/* Event Photos gallery — only rendered when the category has photos */}
      {photos.length > 0 && (
        <section aria-labelledby="event-photos-heading" className="space-y-4">
          <h2 id="event-photos-heading" className="text-xl font-semibold text-gray-900">
            {t('eventPhotos')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setLightboxIndex(idx)}
                className="block aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] cursor-zoom-in"
              >
                <img
                  src={photo.url}
                  alt={t('photoAlt', { n: idx + 1 })}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center text-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}

          <img
            src={photos[lightboxIndex].url}
            alt={`Event photo ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center text-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Next photo"
            >
              ›
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 text-white/70 text-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
