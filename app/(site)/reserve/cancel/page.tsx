import Link from 'next/link';

export const metadata = {
  title: 'Payment Cancelled — Giftoria Workshops',
};

export default function CancelPage() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center py-16">
      <div className="max-w-lg w-full text-center space-y-6 px-4">
        {/* Cancel icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">Payment Cancelled</h1>
          <p className="text-lg text-gray-600">
            No worries — your payment was cancelled and no charges were made.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left text-sm text-gray-600 space-y-2">
          <p>Your spot may still be available. You can try booking again right away, or contact us if you ran into any issues.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/reserve"
            className="bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-2"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="border-2 border-gray-300 text-gray-700 hover:border-[#c99706] hover:text-[#c99706] font-semibold px-6 py-3 rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-2"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
