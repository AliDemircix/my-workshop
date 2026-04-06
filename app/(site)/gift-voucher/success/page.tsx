import Link from 'next/link';

export const metadata = {
  title: 'Gift Card Purchased! — Giftoria Workshops',
  robots: { index: false, follow: false },
};

export default function GiftVoucherSuccessPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-50 border-2 border-[#c99706]/30">
          <svg
            className="w-12 h-12 text-[#c99706]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
            />
          </svg>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Gift Card Purchased! 🎉</h1>
          <p className="text-gray-600">
            Check your inbox — your gift voucher code is on its way.
          </p>
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-4 text-sm text-amber-800">
          Vouchers are valid for 1 year from the date of purchase and can be applied at checkout when booking any workshop.
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/gift-voucher"
            className="inline-block rounded-xl border-2 border-[#c99706] text-[#c99706] hover:bg-[#c99706]/5 font-semibold py-3 px-6 transition-colors"
          >
            Buy Another
          </Link>
          <Link
            href="/"
            className="inline-block rounded-xl bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold py-3 px-6 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
