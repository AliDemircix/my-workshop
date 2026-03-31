import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import GiftCardShop from '@/components/gift/GiftCardShop';

export const metadata = {
  title: 'Gift Cards — Give the Gift of a Workshop',
  description:
    'Treat someone special to a creative workshop experience. Choose an amount and send a beautiful digital gift card instantly.',
};

export default async function GiftVoucherPage() {
  const giftCards = await prisma.giftCard.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <main className="space-y-8">
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
