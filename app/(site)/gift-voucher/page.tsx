import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import GiftCardShop from '@/components/gift/GiftCardShop';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Gift Cards — Give the Gift of a Workshop',
  description:
    'Treat someone special to a creative workshop experience. Choose an amount and send a beautiful digital gift card instantly.',
  alternates: {
    canonical: `${baseUrl}/gift-voucher`,
  },
  openGraph: {
    title: 'Gift Cards — Give the Gift of a Workshop | Giftoria Workshops',
    description:
      'Treat someone special to a creative workshop experience. Choose an amount and send a beautiful digital gift card instantly.',
    url: `${baseUrl}/gift-voucher`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gift Cards — Give the Gift of a Workshop | Giftoria Workshops',
    description:
      'Treat someone special to a creative workshop experience. Choose an amount and send a beautiful digital gift card instantly.',
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
    { '@type': 'ListItem', position: 2, name: 'Gift Cards', item: `${baseUrl}/gift-voucher` },
  ],
};

export default async function GiftVoucherPage() {
  const giftCards = await prisma.giftCard.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <main className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-[#c99706] transition-colors">
          Home
        </Link>
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-800 font-medium">Gift Cards</span>
      </nav>

      <GiftCardShop giftCards={giftCards} />
    </main>
  );
}
