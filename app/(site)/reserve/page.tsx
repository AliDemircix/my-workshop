import ReservationFlow from '@/components/reservation/ReservationFlow';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Reserve Your Spot | Giftoria Workshops',
  description:
    'Pick a workshop, choose a date, and book your spot in minutes. All materials included — join us in Leiden for a hands-on creative experience.',
  alternates: {
    canonical: `${baseUrl}/reserve`,
  },
  openGraph: {
    title: 'Reserve Your Spot | Giftoria Workshops',
    description:
      'Pick a workshop, choose a date, and book your spot in minutes. All materials included — join us in Leiden for a hands-on creative experience.',
    url: `${baseUrl}/reserve`,
    type: 'website',
    images: [{ url: `${baseUrl}/og-default.png`, width: 1200, height: 630, alt: 'Reserve a Giftoria Workshop' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reserve Your Spot | Giftoria Workshops',
    description:
      'Pick a workshop, choose a date, and book your spot in minutes.',
    images: [`${baseUrl}/og-default.png`],
  },
};

export default async function ReservePage({
  searchParams,
}: {
  searchParams: { categoryId?: string; date?: string };
}) {
  const initialCategoryId = searchParams.categoryId ? Number(searchParams.categoryId) : undefined;
  const initialDate = searchParams.date;
  const t = await getTranslations('reserve');

  return (
    <main className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500">
        <Link href="/" className="hover:text-[#c99706] transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{t('breadcrumb')}</span>
      </nav>

      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t('pageTitle')}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('pageSubtitle')}
        </p>
      </div>

      <div className="h-px bg-gray-200" />
      <ReservationFlow initialCategoryId={initialCategoryId} initialDate={initialDate} />
    </main>
  );
}
