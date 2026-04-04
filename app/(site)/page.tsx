import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Slider from '@/components/Slider';
import Testimonials from '@/components/Testimonials';
import FAQ from '@/components/FAQ';
import MailListSubscribe from '@/components/MailListSubscribe';
import { formatEUR } from '@/lib/currency';
import { sanitizeHtml } from '@/lib/sanitize';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Giftoria Workshops — Epoxy Jewelry, Earrings & Necklaces in Leiden',
  description: 'Make your own epoxy earrings, necklaces and other epoxy products in Leiden. Beginner-friendly workshops, all materials included, small groups. Book your spot today!',
  openGraph: {
    title: 'Giftoria Workshops — Epoxy Jewelry, Earrings & Necklaces in Leiden',
    description: 'Make your own epoxy earrings, necklaces and other epoxy products in Leiden. Beginner-friendly workshops, all materials included, small groups. Book your spot today!',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Giftoria Workshops — Epoxy Jewelry, Earrings & Necklaces in Leiden',
    description: 'Make your own epoxy earrings, necklaces and other epoxy products in Leiden. Beginner-friendly workshops, all materials included, small groups. Book your spot today!',
  },
};

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

  const sliderImages = settings?.sliderImages?.map(img => img.url) ?? [];

  return (
    <main className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 -mx-4 px-4 py-16 md:py-24">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5"></div>
        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
              Create Handmade
              <span className="block text-[#c99706]">Epoxy Jewelry</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Make your own epoxy earrings, necklaces and more with real dried flowers — in Leiden.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center text-sm font-medium">
            <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full">⏱ ~2 hours</span>
            <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full">✓ Beginner friendly</span>
            <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full">✓ All materials included</span>
            <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full">🎁 Take home your creations</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/reserve" 
              className="bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Book Your Workshop Now
            </Link>
            <Link 
              href="#workshops" 
              className="border-2 border-[#c99706] text-[#c99706] hover:bg-[#c99706] hover:text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300"
            >
              Explore Workshops
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#c99706]">{categories.length}</div>
              <div className="text-gray-600 font-medium">Workshop Types</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#c99706]">📍</div>
              <div className="text-gray-600 font-medium">Leiden, Netherlands</div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Sessions Preview */}
      {upcomingSessions.length > 0 && (
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">Next Available Sessions</h2>
            <p className="text-lg text-gray-600">Don't miss out - spots are filling up fast!</p>
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
              const dayNumber = sessionDate.toLocaleDateString('nl-NL', { day: 'numeric' });
              const monthAbbr = sessionDate.toLocaleDateString('nl-NL', { month: 'short' });
              const weekday = sessionDate.toLocaleDateString('nl-NL', { weekday: 'long' });
              const timeStr = new Date(session.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

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
                            Fully Booked
                          </span>
                        ) : isAlmostFull ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full motion-safe:animate-pulse">
                            <svg className="w-3 h-3" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                            {remainingSpots} spot{remainingSpots === 1 ? '' : 's'} left
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {remainingSpots} available
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
                      <span className="text-xs text-gray-400">incl. materials</span>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{reservedSpots} reserved</span>
                        <span>{session.capacity} total</span>
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
                        Fully Booked
                      </span>
                    ) : (
                      <Link
                        href={`/reserve?categoryId=${session.category.id}&date=${session.date.getFullYear()}-${String(session.date.getMonth() + 1).padStart(2, '0')}-${String(session.date.getDate()).padStart(2, '0')}`}
                        className="block w-full bg-[#c99706] hover:bg-[#b8860b] active:scale-[0.98] text-white text-center text-sm font-bold py-3 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-2"
                      >
                        Book Now →
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
              View All Available Sessions
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* Workshop Categories Section */}
      {categories.length > 0 && (
        <section id="workshops" className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Workshop Categories</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our range of creative workshops designed to inspire and educate. 
              Each workshop includes all materials and expert guidance.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, idx) => {
              const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
              return (
                <article key={category.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100">
                  <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={(category as any).imageAlt || category.name}
                        title={(category as any).imageTitle || undefined}
                        loading={idx < 3 ? 'eager' : 'lazy'}
                        decoding={idx < 3 ? 'sync' : 'async'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
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
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#c99706] transition-colors duration-300">
                        {category.name}
                      </h3>
                      {category.description && (
                        <div 
                          className="prose prose-sm prose-gray max-w-none text-gray-600 line-clamp-3" 
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(category.description) }} 
                        />
                      )}
                    </div>
                    
                    <Link
                      href={`/workshops/${slug}`}
                      className="block w-full text-center bg-[#c99706] hover:bg-[#b8860b] text-white rounded-lg px-4 py-2 font-semibold transition-all duration-300"
                    >
                      Book Now
                    </Link>
                  </div>
                  
                  {/* Floating badge */}
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

      {/* Product Gallery */}
      {sliderImages.length > 0 && (
        <section className="bg-gray-50 -mx-4 px-4 py-16">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">Beautiful Creations</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get inspired by the amazing pieces created by our workshop participants. 
                These could be your creations too!
              </p>
            </div>
            <Slider images={sliderImages} />
          </div>
        </section>
      )}

      {/* Why Choose Us Section */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Why Choose Giftoria Workshops?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Taught by the maker behind Giftoria epoxy jewelry — real craft, real flowers, real results.
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#c99706] rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Guided by the Maker</h3>
            <p className="text-gray-600">
              You'll be guided by the maker behind Giftoria — someone who designs and sells epoxy jewelry professionally.
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#c99706] rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Real Dried Flowers</h3>
            <p className="text-gray-600">
              Work with premium epoxy resin and real dried flowers — the same materials used in Giftoria's own jewelry collection.
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#c99706] rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Small Groups</h3>
            <p className="text-gray-600">
              Small group sizes mean personal attention for everyone — no experience needed, just creativity.
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
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Create Something Amazing?</h2>
          <p className="text-xl opacity-90">
            Join hundreds of satisfied participants who have discovered the joy of epoxy art crafting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/reserve"
              className="bg-white text-[#c99706] hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300"
            >
              Book Your Workshop Today
            </Link>
            <Link 
              href="https://giftoria.nl"
              className="border-2 border-white text-white hover:bg-white hover:text-[#c99706] font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300"
            >
              Visit Our Store
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
