import { validateReviewToken } from '@/lib/reviewToken';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ReviewForm from '@/components/ReviewForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leave a Review | Giftoria Workshops',
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  searchParams: { token?: string };
}

export default async function ReviewPage({ searchParams }: Props) {
  const { token } = searchParams;

  if (!token) {
    return (
      <main className="max-w-lg mx-auto py-16 text-center space-y-4">
        <p className="text-gray-600">No review token provided.</p>
        <Link href="/" className="text-[#c99706] hover:underline">Back to home</Link>
      </main>
    );
  }

  const payload = validateReviewToken(token);

  if (!payload) {
    return (
      <main className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Link expired or invalid</h1>
        <p className="text-gray-600">This review link has expired or is not valid. Review links are valid for 30 days after they are sent.</p>
        <Link href="/" className="text-[#c99706] hover:underline">Back to home</Link>
      </main>
    );
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: payload.reservationId },
    include: {
      session: {
        include: { category: { select: { id: true, name: true } } },
      },
      review: true,
    },
  });

  if (!reservation || reservation.status !== 'PAID') {
    return (
      <main className="max-w-lg mx-auto py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Review not available</h1>
        <p className="text-gray-600">We could not find a completed booking for this review link.</p>
        <Link href="/" className="text-[#c99706] hover:underline">Back to home</Link>
      </main>
    );
  }

  if (reservation.review) {
    return (
      <main className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Review already submitted</h1>
        <p className="text-gray-600">Thank you! We have already received your review for this workshop.</p>
        <Link href="/" className="text-[#c99706] hover:underline">Back to home</Link>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Leave a Review</h1>
        <p className="text-gray-600">
          How was your <strong>{reservation.session.category.name}</strong> workshop on{' '}
          {new Date(reservation.session.date).toDateString()}?
        </p>
      </div>

      <ReviewForm
        token={token}
        customerName={reservation.name || ''}
      />
    </main>
  );
}
