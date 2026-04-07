import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Under Maintenance — Giftoria Workshops',
  description: 'We are currently performing scheduled maintenance. We will be back shortly.',
  robots: { index: false, follow: false },
};

const DEFAULT_MESSAGE =
  "We are currently performing scheduled maintenance. We'll be back shortly!";

export default async function MaintenancePage() {
  const settings = await (prisma as any).siteSettings.findUnique({ where: { id: 1 } });
  const message: string = settings?.maintenanceMessage || DEFAULT_MESSAGE;
  const logoUrl: string | null = settings?.logoUrl ?? null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-xl w-full space-y-8">
        {/* Logo */}
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Giftoria Workshops"
            className="h-14 w-auto mx-auto"
          />
        ) : (
          <p className="text-2xl font-bold text-[#c99706] tracking-tight">
            Giftoria Workshops
          </p>
        )}

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-[#c99706]/10 rounded-full flex items-center justify-center">
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
                d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.653-4.655m6.162-3.79a3.375 3.375 0 0 0-4.773-4.773L6.232 6.96a2.96 2.96 0 0 1 .348 3.671l-.915 1.338"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900">We&apos;ll Be Back Soon</h1>
          <p className="text-lg text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Footer note */}
        <p className="text-sm text-gray-400">
          Thank you for your patience. If you need urgent assistance, please check back later.
        </p>
      </div>
    </main>
  );
}
