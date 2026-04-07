import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { slugify } from '@/lib/slug';
import { getLocale } from 'next-intl/server';
import WorkshopDetail from '@/components/workshop/WorkshopDetail';
import WorkshopReviews from '@/components/workshop/WorkshopReviews';
import Link from 'next/link';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const category = await (prisma.category as any).findFirst({ where: { slug } });

  if (!category) {
    return { title: 'Workshop Not Found' };
  }

  const title = `${category.name} | Giftoria Workshops`;
  const description =
    category.descriptionEn ?? category.description ?? `Book the ${category.name} workshop at Giftoria.`;
  const imageUrl = category.imageUrl ?? undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/workshops/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/workshops/${slug}`,
      type: 'website',
      images: imageUrl
        ? [{ url: imageUrl, alt: category.name }]
        : [{ url: `${baseUrl}/og-default.png`, width: 1200, height: 630, alt: category.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [`${baseUrl}/og-default.png`],
    },
  };
}

export default async function WorkshopDetailPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  if (!slug) return notFound();

  let category = await (prisma.category as any).findFirst({
    where: { slug },
    include: { photos: { orderBy: { position: 'asc' } } },
  });
  if (!category) {
    const all = await prisma.category.findMany();
    const match = all.find((c: any) => slugify(c.name) === slug);
    if (!match) return notFound();
    await prisma.category.update({ where: { id: match.id }, data: ({ slug } as any) });
    category = match;
  }

  const [locale, upcomingSessions, settings, approvedReviews] = await Promise.all([
    getLocale(),
    prisma.session.findMany({
      where: {
        categoryId: category.id,
        date: { gte: new Date() },
      },
      orderBy: { date: 'asc' },
      take: 10,
    }),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
    prisma.review.findMany({
      where: { categoryId: category.id, approved: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  function pick(nl: string | null, en: string | null, tr: string | null) {
    if (locale === 'en') return en ?? nl ?? null;
    if (locale === 'tr') return tr ?? nl ?? null;
    return nl ?? null;
  }

  const resolvedDescription    = pick(category.description,    category.descriptionEn,    category.descriptionTr);
  const resolvedLongDescription = pick(category.longDescription, category.longDescriptionEn, category.longDescriptionTr);

  // Build Event JSON-LD — one entry per upcoming session, or a single stub if none exist
  const locationSchema = {
    '@type': 'Place',
    name: 'Giftoria Workshops',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Leiden',
      addressCountry: 'NL',
      ...(settings?.address ? { streetAddress: settings.address } : {}),
    },
  };

  const organizerSchema = {
    '@type': 'Organization',
    name: 'Giftoria',
    url: baseUrl,
  };

  const plainDescription = resolvedDescription
    ? resolvedDescription.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : `Book the ${category.name} workshop at Giftoria in Leiden.`;

  // AggregateRating JSON-LD (only rendered when there are approved reviews)
  const aggregateRatingSchema =
    approvedReviews.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: category.name,
          description: plainDescription,
          url: `${baseUrl}/workshops/${slug}`,
          ...(category.imageUrl ? { image: category.imageUrl } : {}),
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: (
              approvedReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
              approvedReviews.length
            ).toFixed(1),
            reviewCount: approvedReviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: approvedReviews.slice(0, 5).map((r: { name: string; rating: number; text: string; createdAt: Date }) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.name },
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            reviewBody: r.text,
            datePublished: new Date(r.createdAt).toISOString().split('T')[0],
          })),
        }
      : null;

  const eventSchemas = upcomingSessions.length > 0
    ? upcomingSessions.map((session) => ({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: category.name,
        description: plainDescription,
        url: `${baseUrl}/workshops/${slug}`,
        startDate: session.startTime.toISOString(),
        endDate: session.endTime.toISOString(),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: locationSchema,
        organizer: organizerSchema,
        offers: {
          '@type': 'Offer',
          price: (session.priceCents / 100).toFixed(2),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: `${baseUrl}/reserve?categoryId=${category.id}`,
          validFrom: new Date().toISOString(),
        },
        ...(category.imageUrl ? { image: [category.imageUrl] } : {}),
      }))
    : [
        {
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: category.name,
          description: plainDescription,
          url: `${baseUrl}/workshops/${slug}`,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: locationSchema,
          organizer: organizerSchema,
          ...(category.imageUrl ? { image: [category.imageUrl] } : {}),
        },
      ];

  return (
    <div className="space-y-10">
      {eventSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {aggregateRatingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingSchema) }}
        />
      )}

      <h1 className="text-2xl font-bold">{category.name}</h1>
      <WorkshopDetail category={{ ...category, description: resolvedDescription, longDescription: resolvedLongDescription }} />

      {/* Private event CTA */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-xl font-bold text-gray-900">Interested in a private session?</h2>
          <p className="text-gray-600">
            Book a private {category.name} workshop for your group — parties, team events, and more.
          </p>
        </div>
        <Link
          href="/private-event"
          className="flex-shrink-0 bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold px-6 py-3 rounded-lg text-sm transition-all duration-300 whitespace-nowrap"
        >
          Inquire about a private event
        </Link>
      </div>

      {/* Customer reviews */}
      <WorkshopReviews reviews={approvedReviews as any} categoryName={category.name} />
    </div>
  );
}
