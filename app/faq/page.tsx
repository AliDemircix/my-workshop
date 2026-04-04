"use client";

import FAQ from '@/components/FAQ';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function FAQPage() {
  const t = useTranslations('faq');
  const tn = useTranslations('nav');

  return (
    <main className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500">
        <Link href="/" className="hover:text-[#c99706] transition-colors">
          {tn('home')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{t('title')}</span>
      </nav>

      <div className="h-px bg-gray-200" />

      {/* FAQ component renders its own title + all questions */}
      <FAQ />

      {/* Still Need Help banner */}
      <div className="bg-gradient-to-r from-[#c99706] to-[#b8860b] -mx-4 px-4 py-12 text-white text-center mt-16">
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">{t('stillNeedHelp')}</h2>
          <p className="text-lg opacity-90">{t('stillNeedHelpBody')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://giftoria.nl/contact-us"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-[#c99706] hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-all duration-300"
            >
              {t('contactUs')}
            </a>
            <Link
              href="/reserve"
              className="border-2 border-white text-white hover:bg-white hover:text-[#c99706] font-semibold px-6 py-3 rounded-lg transition-all duration-300"
            >
              {t('bookWorkshop')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
