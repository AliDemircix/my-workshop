import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Booking Confirmed — Giftoria Workshops',
  robots: { index: false, follow: false },
};

export default async function SuccessPage() {
  const t = await getTranslations('reserve');

  return (
    <main className="min-h-[60vh] flex items-center justify-center py-16">
      <div className="max-w-lg w-full text-center space-y-6 px-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">{t('successTitle')}</h1>
          <p className="text-lg text-gray-600">{t('successSubtitle')}</p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-left space-y-3">
          <h2 className="font-semibold text-gray-900">{t('whatsNext')}</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {(['nextStep1', 'nextStep2', 'nextStep3'] as const).map((key) => (
              <li key={key} className="flex items-start gap-2">
                <svg className="w-4 h-4 text-[#c99706] mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-2"
          >
            {t('backToHome')}
          </Link>
          <Link
            href="/reserve"
            className="border-2 border-gray-300 text-gray-700 hover:border-[#c99706] hover:text-[#c99706] font-semibold px-6 py-3 rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-2"
          >
            {t('bookAnother')}
          </Link>
        </div>
      </div>
    </main>
  );
}
