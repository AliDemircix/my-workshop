"use client";

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Fires a GA4 page_view event on every client-side route change.
 * Must be a client component because it relies on usePathname and
 * useSearchParams, which are only available in the browser.
 *
 * This component renders no markup — it is side-effect only.
 */
export default function GAPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID || typeof window.gtag !== 'function') return;

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

    window.gtag('event', 'page_view', {
      page_path: url,
      page_location: window.location.href,
    });
  }, [pathname, searchParams]);

  return null;
}

// Extend the global Window type so TypeScript knows about gtag.
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
