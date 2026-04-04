export const dynamic = 'force-dynamic';
import './globals.css';
import type { ReactNode } from 'react';
import { prisma } from '@/lib/prisma';
import Providers from '@/components/Providers';
import Nav from '@/components/Nav';
import { isAdminAuthenticated } from '@/lib/auth';
import Footer from '@/components/Footer';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export const metadata = {
  title: 'Workshop Reservations',
  description: 'Book an epoxy workshop session',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const logoUrl = (settings as any)?.logoUrl as string | undefined;
  const isAdmin = isAdminAuthenticated();
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body className="bg-white text-gray-900">
        <NextIntlClientProvider locale={locale} messages={messages}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            {/* Sticky top navigation bar */}
            <header className="sticky top-0 z-50 bg-black text-white">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <a href="/" className="inline-flex items-center gap-2" aria-label="Home">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Site logo" className="h-8 w-auto" />
                  ) : (
                    <span className="text-lg font-semibold tracking-wide">Giftoria</span>
                  )}
                  <span className="sr-only">Home</span>
                </a>
                <div className="flex items-center gap-3">
                  <Nav isAdmin={isAdmin} />
                  <LanguageSwitcher currentLocale={locale as 'en' | 'nl' | 'tr'} />
                </div>
              </div>
              {/* Announcement bar — admin-editable */}
              {((settings as any)?.announcementBar ?? 'Limited-time discounts available — book early to save!') && (
                <div className="bg-[#e9b306] text-black">
                  <div className="max-w-7xl mx-auto px-4 py-1 text-center text-xs sm:text-sm font-medium">
                    {(settings as any)?.announcementBar ?? 'Limited-time discounts available — book early to save!'}
                  </div>
                </div>
              )}
            </header>

            <main className="flex-1">
              <div className="max-w-7xl mx-auto px-4 py-6">
                {children}
              </div>
            </main>

            <Footer />
          </div>
        </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
