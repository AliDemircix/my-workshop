import type { ReactNode } from 'react';
import { Suspense } from 'react';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import GAPageTracker from '@/components/GAPageTracker';

/**
 * Layout for all public-facing (site) pages.
 * Scopes Google Analytics to the public site only — GA scripts are never
 * injected into admin pages, which live under app/admin/ outside this group.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <GoogleAnalytics />
      {/*
        GAPageTracker uses useSearchParams(), which must be wrapped in Suspense
        per the Next.js App Router rules to avoid a static-rendering bailout.
      */}
      <Suspense fallback={null}>
        <GAPageTracker />
      </Suspense>
      {children}
    </>
  );
}
