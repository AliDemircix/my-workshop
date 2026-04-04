"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function FAQ({ limit }: { limit?: number } = {}) {
  const t = useTranslations('faq');
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqs = [
    { id: 1, question: t('q1'), answer: t('a1') },
    { id: 2, question: t('q2'), answer: t('a2') },
    { id: 3, question: t('q3'), answer: t('a3') },
    { id: 4, question: t('q4'), answer: t('a4') },
    { id: 5, question: t('q5'), answer: t('a5') },
    { id: 6, question: t('q6'), answer: t('a6') },
    { id: 7, question: t('q7'), answer: t('a7') },
    { id: 8, question: t('q8'), answer: t('a8') },
  ];

  const toggleItem = (id: number) => {
    setOpenItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const visibleFaqs = limit ? faqs.slice(0, limit) : faqs;

  return (
    <section className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">{t('title')}</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('subtitle')}</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {visibleFaqs.map((faq) => (
          <div
            key={faq.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300"
          >
            <button
              onClick={() => toggleItem(faq.id)}
              className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 flex justify-between items-center transition-colors duration-200"
              aria-expanded={openItems.includes(faq.id)}
            >
              <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
              <svg
                className={`w-5 h-5 text-[#c99706] transform transition-transform duration-200 flex-shrink-0 ${
                  openItems.includes(faq.id) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openItems.includes(faq.id) && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {limit && faqs.length > limit ? (
        <div className="text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 text-[#c99706] hover:text-[#b8860b] font-semibold text-lg underline underline-offset-4 transition-colors"
          >
            {t('viewAll', { count: faqs.length })}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="text-center bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('stillTitle')}</h3>
          <p className="text-gray-600 mb-4">{t('stillBody')}</p>
          <a
            href="https://giftoria.nl/contact-us"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
          >
            {t('contactUs')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </section>
  );
}
