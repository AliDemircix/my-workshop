import './globals.css';
import type { ReactNode } from 'react';
import { prisma } from '@/lib/prisma';
import Providers from '@/components/Providers';
import Nav from '@/components/Nav';
import { isAdminAuthenticated } from '@/lib/auth';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Workshop Reservations',
  description: 'Book an epoxy workshop session',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const logoUrl = (settings as any)?.logoUrl as string | undefined;
  const isAdmin = isAdminAuthenticated();
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
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
                <Nav isAdmin={isAdmin} />
              </div>
              {/* Announcement bar for discounts/opportunities */}
              <div className="bg-[#e9b306] text-black">
                <div className="max-w-7xl mx-auto px-4 py-1 text-center text-xs sm:text-sm font-medium">
                  Limited-time discounts available — book early to save!
                </div>
              </div>
            </header>

            <main className="flex-1">
              <div className="max-w-7xl mx-auto px-4 py-6">
                {children}
              </div>
            </main>

            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
