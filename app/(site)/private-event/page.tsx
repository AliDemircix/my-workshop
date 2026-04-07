import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import PrivateEventForm from '@/components/PrivateEventForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Private Event | Giftoria Workshops',
  description:
    'Organise a private workshop for your group — birthday parties, team events, hen parties and more. Fill in the inquiry form and we will get back to you.',
};

export default async function PrivateEventPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <main className="space-y-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500">
        <Link href="/" className="hover:text-[#c99706] transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Private Event Inquiry</span>
      </nav>

      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Book a Private Event</h1>
        <p className="text-lg text-gray-600">
          Planning a birthday party, team outing, hen party, or family gathering? We offer private
          workshop sessions for groups of any size. Fill in the form below and we will reach out
          to discuss availability and pricing.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: '👥', title: 'Any group size', body: 'From small gatherings to large corporate events' },
          { icon: '🎨', title: 'Choose your workshop', body: 'Pick the craft that suits your group best' },
          { icon: '📅', title: 'Flexible scheduling', body: 'We work around your preferred dates' },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-center space-y-1">
            <div className="text-2xl">{item.icon}</div>
            <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
            <p className="text-xs text-gray-600">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="h-px bg-gray-200" />

      <PrivateEventForm categories={categories} />
    </main>
  );
}
