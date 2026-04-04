"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

type Props = { isAdmin?: boolean; logoUrl?: string };

export default function Nav({ isAdmin = false }: Props) {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const t = useTranslations('nav');

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/gift-voucher', label: t('giftCards') },
    { href: '/faq', label: t('faq') },
  ];

  return (
    <>
      {/* ── Desktop nav ── */}
      <nav className="hidden md:flex items-center gap-5 text-sm" aria-label="Main navigation">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={`underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm ${
              isActive(href) ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'
            }`}
          >
            {label}
          </Link>
        ))}

        <Link
          href="/reserve"
          className="bg-[#c99706] hover:bg-[#b8860b] text-white px-4 py-2 rounded-md font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          {t('bookWorkshop')}
        </Link>

        <a
          href="https://giftoria.nl"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 text-gray-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
        >
          {t('webshop')}
        </a>

        {isAdmin && (
          <Link
            href="/admin"
            aria-current={isActive('/admin') ? 'page' : undefined}
            className={`underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm ${
              isActive('/admin') ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'
            }`}
          >
            {t('admin')}
          </Link>
        )}
      </nav>

      {/* ── Mobile: Book CTA + Hamburger ── */}
      <div className="flex md:hidden items-center gap-2">
        <Link
          href="/reserve"
          className="bg-[#c99706] hover:bg-[#b8860b] text-white text-sm px-3 py-1.5 rounded-md font-semibold transition-colors"
        >
          {t('book')}
        </Link>

        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="block w-5 h-0.5 bg-white" />
          <span className="block w-5 h-0.5 bg-white" />
          <span className="block w-4 h-0.5 bg-white self-start" />
        </button>
      </div>

      {/* ── Mobile full-screen overlay ── */}
      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-[100] bg-black flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          {/* Overlay header row with brand + close */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <span className="text-lg font-semibold tracking-wide text-white">Giftoria</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="w-10 h-10 flex items-center justify-center text-white rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col px-6 py-4 flex-1 overflow-y-auto" aria-label="Mobile navigation links">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={`flex items-center justify-between py-4 border-b border-white/10 text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] rounded ${
                  isActive(href) ? 'text-[#c99706]' : 'text-white hover:text-[#c99706]'
                }`}
              >
                {label}
                <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}

            <a
              href="https://giftoria.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-4 border-b border-white/10 text-lg font-medium text-white hover:text-[#c99706] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] rounded"
            >
              {t('webshop')}
              <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center justify-between py-4 border-b border-white/10 text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] rounded ${
                  isActive('/admin') ? 'text-[#c99706]' : 'text-white hover:text-[#c99706]'
                }`}
              >
                Admin
                <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}

            <div className="pt-6 pb-4">
              <Link
                href="/reserve"
                className="block w-full bg-[#c99706] hover:bg-[#b8860b] text-white text-center font-semibold py-4 rounded-xl text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
              >
                {t('bookWorkshop')}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
