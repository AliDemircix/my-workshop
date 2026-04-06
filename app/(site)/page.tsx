import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import Slider from '@/components/Slider';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import MailListSubscribe from '@/components/MailListSubscribe';
import { formatEUR } from '@/lib/currency';
import { sanitizeHtml } from '@/lib/sanitize';
import { getTranslations, getLocale } from 'next-intl/server';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const localeMap: Record<string, string> = {
  en: 'en_GB',
  nl: 'nl_NL',
  tr: 'tr_TR',
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ogLocale = localeMap[locale] ?? 'nl_NL';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const title = 'Giftoria Workshops — Epoxy Jewelry, Earrings & Necklaces in Leiden';
  const description =
    'Make your own epoxy earrings, necklaces and other epoxy products in Leiden. Beginner-friendly workshops, all materials included, small groups. Book your spot today!';

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/`,
      type: 'website',
      locale: ogLocale,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function HomePage() {
  // Fetch data for the home page
  const [categories, settings, upcomingSessions] = await Promise.all([
    prisma.category.findMany({ 
      orderBy: { name: 'asc' },
      take: 6 // Show only first 6 categories on home page
    }),
    prisma.siteSettings.findUnique({ 
      where: { id: 1 },
      include: { sliderImages: { orderBy: { position: 'asc' } } }
    }),
    // Get next 3 upcoming sessions with availability
    prisma.session.findMany({
      where: {
        date: {
          gte: new Date()
        }
      },
      include: {
        category: true,
        _count: { select: { reservations: true } },
        reservations: { 
          select: { quantity: true, status: true },
          where: {
            status: { notIn: ['CANCELED', 'REFUNDED'] }
          }
        }
      },
      orderBy: { date: 'asc' },
      take: 3
    })
  ]);

  const t = await getTranslations('home');
  const locale = await getLocale();

  // Pick the locale-appropriate category description, falling back to primary (nl)
  function pickDesc(cat: any): string | null {
    if (locale === 'en') return cat.descriptionEn ?? cat.description ?? null;
    if (locale === 'tr') return cat.descriptionTr ?? cat.description ?? null;
    return cat.description ?? null;
  }

  const sliderImages = settings?.sliderImages?.map(img => img.url) ?? [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Giftoria Workshops',
    description:
      'Epoxy jewelry workshops in Leiden — make your own earrings, necklaces and more with real dried flowers. Beginner-friendly, all materials included.',
    url: appUrl,
    telephone: settings?.telephone ?? undefined,
    ...(settings?.address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: settings.address,
            addressLocality: 'Leiden',
            addressCountry: 'NL',
          },
        }
      : {
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Leiden',
            addressCountry: 'NL',
          },
        }),
    sameAs: [
      settings?.instagramUrl,
      settings?.facebookUrl,
      settings?.youtubeUrl,
      'https://giftoria.nl',
    ].filter(Boolean),
  };

  return (
    <main className="space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 -mx-4 px-4 py-16 md:py-24">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5"></div>
        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
              {t('heroTitle')}
              <span className="block text-[#c99706]">{t('heroTitleHighlight')}</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('heroSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center text-sm font-medium">
            <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full">⏱ {t('badge2h')}</span>
            <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full">✓ {t('badgeBeginner')}</span>
            <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full">✓ {t('badgeMaterials')}</span>
            <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full">🎁 {t('badgeTakeHome')}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/reserve" 
              className="bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {t('bookNow')}
            </Link>
            <Link 
              href="#workshops" 
              className="border-2 border-[#c99706] text-[#c99706] hover:bg-[#c99706] hover:text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300"
            >
              {t('exploreWorkshops')}
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#c99706]">{categories.length}</div>
              <div className="text-gray-600 font-medium">{t('workshopTypes')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#c99706]">📍</div>
              <div className="text-gray-600 font-medium">{t('location')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Sessions Preview */}
      {upcomingSessions.length > 0 && (
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">{t('nextSessions')}</h2>
            <p className="text-lg text-gray-600">{t('nextSessionsSub')}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {upcomingSessions.map((session) => {
              const reservedSpots = session.reservations.reduce(
                (sum, r) => (['CANCELED', 'REFUNDING', 'REFUNDED'].includes(r.status) ? sum : sum + r.quantity),
                0
              );
              const remainingSpots = Math.max(0, session.capacity - reservedSpots);
              const isFull = remainingSpots === 0;
              const isAlmostFull = !isFull && remainingSpots <= 2;
              const fillPct = Math.round((reservedSpots / session.capacity) * 100);
              const sessionDate = new Date(session.date);
              const dateLocale = locale === 'en' ? 'en-GB' : locale === 'tr' ? 'tr-TR' : 'nl-NL';
              const dayNumber = sessionDate.toLocaleDateString(dateLocale, { day: 'numeric' });
              const monthAbbr = sessionDate.toLocaleDateString(dateLocale, { month: 'short' });
              const weekday = sessionDate.toLocaleDateString(dateLocale, { weekday: 'long' });
              const timeStr = new Date(session.startTime).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={session.id}
                  className={`relative bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-300 ${
                    isFull ? 'shadow-md opacity-60' : 'shadow-md hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  {/* Top accent bar */}
                  <div className={`h-1 w-full ${isFull ? 'bg-gray-300' : 'bg-[#c99706]'}`} />

                  <div className="p-5 space-y-4">
                    {/* Date + time row */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                          isFull ? 'bg-gray-100' : 'bg-amber-50'
                        }`}
                      >
                        <span
                          className={`text-xl font-bold leading-none ${
                            isFull ? 'text-gray-400' : 'text-[#c99706]'
                          }`}
                        >
                          {dayNumber}
                        </span>
                        <span
                          className={`text-xs font-medium uppercase tracking-wide mt-0.5 ${
                            isFull ? 'text-gray-400' : 'text-amber-700'
                          }`}
                        >
                          {monthAbbr}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{weekday}</span>
                        <span className="text-sm font-semibold text-gray-800">{timeStr}</span>
                      </div>

                      {/* Urgency badge */}
                      <div className="ml-auto">
                        {isFull ? (
                          <span className="inline-flex items-center bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {t('fullyBooked')}
                          </span>
                        ) : isAlmostFull ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full motion-safe:animate-pulse">
                            <svg className="w-3 h-3" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                            {remainingSpots === 1 ? t('spotsLeft', { n: remainingSpots }) : t('spotsLeftPlural', { n: remainingSpots })}
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {t('available', { n: remainingSpots })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category name */}
                    <p className="text-base font-bold text-gray-900">{session.category.name}</p>

                    {/* Price row */}
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-2xl font-bold ${isFull ? 'text-gray-400' : 'text-[#c99706]'}`}>
                        {formatEUR(session.priceCents)}
                      </span>
                      <span className="text-xs text-gray-400">{t('inclMaterials')}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{reservedSpots} {t('reserved')}</span>
                        <span>{session.capacity} {t('total')}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          role="progressbar"
                          aria-valuenow={fillPct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${fillPct}% of capacity reserved`}
                          className={`h-full rounded-full transition-all duration-500 ${
                            fillPct >= 75 ? 'bg-red-500' : fillPct >= 50 ? 'bg-amber-400' : 'bg-[#c99706]'
                          }`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    {isFull ? (
                      <span
                        aria-disabled="true"
                        className="block w-full bg-gray-100 text-gray-400 text-center text-sm font-bold py-3 rounded-xl cursor-not-allowed"
                      >
                        {t('fullyBooked')}
                      </span>
                    ) : (
                      <Link
                        href={`/reserve?categoryId=${session.category.id}&date=${session.date.getFullYear()}-${String(session.date.getMonth() + 1).padStart(2, '0')}-${String(session.date.getDate()).padStart(2, '0')}`}
                        className="block w-full bg-[#c99706] hover:bg-[#b8860b] active:scale-[0.98] text-white text-center text-sm font-bold py-3 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-2"
                      >
                        {t('bookNowArrow')}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              href="/reserve"
              className="inline-flex items-center gap-2 text-[#c99706] hover:text-[#b8860b] font-semibold text-lg underline underline-offset-4"
            >
              {t('viewAll')}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* Workshop Categories Section */}
      {categories.length > 0 && (
        <section id="workshops" className="space-y-10">

          {/* Section header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{t('ourWorkshops')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('ourWorkshopsSub')}
            </p>
          </div>

          {/* Card grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, idx) => {
              const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
              return (
                <article
                  key={category.id}
                  className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-amber-100/60"
                >
                  {/* Gold top accent bar — matches session cards */}
                  <div className="h-1 w-full bg-[#c99706]" />

                  {/* Image block */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden">
                    {category.imageUrl ? (
                      <>
                        <Image
                          src={category.imageUrl}
                          alt={(category as any).imageAlt || category.name}
                          title={(category as any).imageTitle || undefined}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover scale-100 group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        {/* Base gradient: always present */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        {/* Hover overlay: deepens on interaction */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      /* No-image fallback: warm amber gradient + craft icon */
                      <div className="w-full h-full bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100 flex flex-col items-center justify-center gap-3">
                        <svg
                          className="w-14 h-14 text-[#c99706] opacity-60"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                        </svg>
                        <span className="text-xs font-semibold tracking-widest uppercase text-amber-700/70">Handcrafted</span>
                      </div>
                    )}

                    {/* Category title overlaid on the photo */}
                    <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-8">
                      <h3 className="text-xl font-bold text-white leading-snug drop-shadow-sm">
                        {category.name}
                      </h3>
                    </div>
                  </div>

                  {/* Card body: teaser + CTA */}
                  <div className="px-5 pt-4 pb-5 space-y-4">
                    {pickDesc(category) && (
                      <div
                        className="text-sm text-gray-600 leading-relaxed line-clamp-2 prose prose-sm prose-gray max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(pickDesc(category)!) }}
                      />
                    )}

                    <Link
                      href={`/workshops/${slug}`}
                      className="group/cta flex items-center justify-center gap-2 w-full bg-[#c99706] hover:bg-[#b8860b] active:scale-[0.98] text-white text-sm font-bold py-3 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-2"
                    >
                      <span>{t('exploreAndBook')}</span>
                      <svg
                        className="w-4 h-4 translate-x-0 group-hover/cta:translate-x-1 transition-transform duration-200"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Product Gallery */}
      {sliderImages.length > 0 && (
        <section className="bg-gray-50 -mx-4 px-4 py-16">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">{t('beautyTitle')}</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {t('beautySub')}
              </p>
            </div>
            <Slider images={sliderImages} />
          </div>
        </section>
      )}

      {/* Why Choose Us Section */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">{t('whyTitle')}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('whySub')}
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#c99706] rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{t('why1Title')}</h3>
            <p className="text-gray-600">
              {t('why1Body')}
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#c99706] rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{t('why2Title')}</h3>
            <p className="text-gray-600">
              {t('why2Body')}
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#c99706] rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{t('why3Title')}</h3>
            <p className="text-gray-600">
              {t('why3Body')}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ limit={5} />

      {/* Testimonials Section — only shown when enabled in admin settings */}
      {settings?.showTestimonials && <Testimonials />}

      {/* Mailing List Subscribe */}
      <MailListSubscribe />

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-[#c99706] to-[#b8860b] -mx-4 px-4 py-16 text-white text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">{t('ctaTitle')}</h2>
          <p className="text-xl opacity-90">
            {t('ctaBody')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/reserve"
              className="bg-white text-[#c99706] hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300"
            >
              {t('ctaButton')}
            </Link>
            <Link 
              href="https://giftoria.nl"
              className="border-2 border-white text-white hover:bg-white hover:text-[#c99706] font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300"
            >
              {t('ctaStore')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
