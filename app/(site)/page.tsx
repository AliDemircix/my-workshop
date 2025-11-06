import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Slider from '@/components/Slider';
import Testimonials from '@/components/Testimonials';
import { formatEUR } from '@/lib/currency';
import { sanitizeHtml } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

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
              Create Beautiful
              <span className="block text-[#c99706]">Epoxy Art</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Join our hands-on workshops and learn the art of epoxy resin crafting. 
              Perfect for beginners and experienced crafters alike.
            </p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#c99706]">500+</div>
              <div className="text-gray-600 font-medium">Happy Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#c99706]">{categories.length}+</div>
              <div className="text-gray-600 font-medium">Workshop Types</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#c99706]">5★</div>
              <div className="text-gray-600 font-medium">Average Rating</div>
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
              const reservedSpots = session.reservations.reduce((sum, r) => sum + r.quantity, 0);
              const remainingSpots = session.capacity - reservedSpots;
              const isAlmostFull = remainingSpots <= 2;
              
              return (
                <div key={session.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg text-gray-900">{session.category.name}</h3>
                      {isAlmostFull && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                          Almost Full!
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium">{new Date(session.date).toLocaleDateString('nl-NL', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="font-medium">
                          {new Date(session.startTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-bold text-[#c99706]">{formatEUR(session.priceCents)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available spots:</span>
                        <span className={`font-medium ${isAlmostFull ? 'text-red-600' : 'text-green-600'}`}>
                          {remainingSpots}/{session.capacity}
                        </span>
                      </div>
                    </div>
                    
                    <Link 
                      href="/reserve"
                      className="block w-full bg-[#c99706] hover:bg-[#b8860b] text-white text-center font-semibold py-3 rounded-lg transition-all duration-300"
                    >
                      Book Now
                    </Link>
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
            {categories.map((category) => {
              const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
              return (
                <article key={category.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100">
                  <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {category.imageUrl ? (
                      <img 
                        src={category.imageUrl} 
                        alt={category.name} 
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
                    
                    <div className="flex gap-3">
                      <Link 
                        href={`/workshops/${slug}`} 
                        className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg px-4 py-2 font-medium transition-all duration-300"
                      >
                        Learn More
                      </Link>
                      <Link 
                        href="/reserve" 
                        className="flex-1 text-center bg-[#c99706] hover:bg-[#b8860b] text-white rounded-lg px-4 py-2 font-semibold transition-all duration-300"
                      >
                        Book Now
                      </Link>
                    </div>
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
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#c99706] rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Expert Guidance</h3>
            <p className="text-gray-600">
              Learn from experienced artisans who will guide you through every step of the creative process.
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#c99706] rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">All Materials Included</h3>
            <p className="text-gray-600">
              Everything you need is provided - premium epoxy resins, molds, colors, and safety equipment.
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
              Intimate class sizes ensure personalized attention and a better learning experience for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

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
