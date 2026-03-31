import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/auth';
import SettingsToast from '@/components/admin/SettingsToast';

export const dynamic = 'force-dynamic';

async function savePolicy(formData: FormData) {
  'use server';
  requireAdminAction();
  const get = (k: string) => String(formData.get(k) ?? '').trim();

  const data = {
    privacyLabel: get('privacyLabel') || 'Privacy Policy',
    privacyUrl: '/privacy-policy',
    refundLabel: get('refundLabel') || 'Refund Policy',
    refundUrl: '/refund',
    contactLabel: get('contactLabel') || 'Contact',
    contactUrl: 'https://www.giftoria.nl/contact-us',
  };

  if (!data.privacyLabel || !data.refundLabel || !data.contactLabel) {
    return redirect('/admin/settings/policy?error=1');
  }

  try {
    await (prisma as any).siteSettings.upsert({
      where: { id: 1 },
      update: { ...data },
      create: { id: 1, ...data },
    });
  } catch {
    return redirect('/admin/settings/policy?error=1');
  }

  revalidatePath('/');
  redirect('/admin/settings/policy?saved=1');
}

export default async function PolicySettingsPage() {
  const current = await (prisma as any).siteSettings.findUnique({ where: { id: 1 } });

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Policy & Pages</h1>
        <p className="text-gray-600 mt-1">Manage the footer link labels for policy and contact pages</p>
      </div>

      <SettingsToast />

      <form action={savePolicy} className="space-y-6">
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-3">Policy & Pages</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <input
                name="privacyLabel"
                className="border rounded px-3 py-2"
                placeholder="Privacy label"
                defaultValue={current?.privacyLabel ?? ''}
                required
              />
              <div className="text-sm text-gray-500 md:col-span-2">
                Link is hard-coded to{' '}
                <span className="font-mono">/privacy-policy</span>. Edit content in{' '}
                <a className="underline" href="/admin/pages/privacy">Admin â†’ Privacy page</a>.
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <input
                name="refundLabel"
                className="border rounded px-3 py-2"
                placeholder="Refund label"
                defaultValue={current?.refundLabel ?? ''}
                required
              />
              <div className="text-sm text-gray-500 md:col-span-2">
                Link is hard-coded to{' '}
                <span className="font-mono">/refund</span>. Edit content in{' '}
                <a className="underline" href="/admin/pages/refund">Admin â†’ Refund page</a>.
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <input
                name="contactLabel"
                className="border rounded px-3 py-2"
                placeholder="Contact label"
                defaultValue={current?.contactLabel ?? ''}
                required
              />
              <div className="text-sm text-gray-500 md:col-span-2">
                Contact link is hard-coded to{' '}
                <a
                  className="underline"
                  href="https://www.giftoria.nl/contact-us"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://www.giftoria.nl/contact-us
                </a>.
              </div>
            </div>
          </div>
        </section>

        <div>
          <button type="submit" className="bg-gray-900 text-white rounded px-4 py-2">
            Save policy settings
          </button>
        </div>
      </form>
    </div>
  );
}
