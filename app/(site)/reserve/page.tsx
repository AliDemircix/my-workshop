import ReservationFlow from '@/components/reservation/ReservationFlow';
import Link from 'next/link';

export default function ReservePage() {
  return (
    <main className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500">
        <Link href="/" className="hover:text-[#c99706] transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Book Workshop</span>
      </nav>

      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Book Your Creative Workshop</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose your preferred workshop, select a date and time, and join us for an inspiring creative experience!
        </p>
      </div>

      <div className="h-px bg-gray-200" />
      <ReservationFlow />
    </main>
  );
}
