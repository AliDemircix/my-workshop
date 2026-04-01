import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/auth';
import SettingsToast from '@/components/admin/SettingsToast';

export const dynamic = 'force-dynamic';

async function saveBranding(formData: FormData) {
  'use server';
  requireAdminAction();
  const get = (k: string) => String(formData.get(k) ?? '').trim();
  const addHttps = (v: string) =>
    v && !/^(?:https?:\/\/|\/)/.test(v) ? `https://${v}` : v;

  const data = {
    logoUrl: addHttps(get('logoUrl')),
    announcementBar: get('announcementBar'),
  };

  try {
    await (prisma as any).siteSettings.upsert({
      where: { id: 1 },
      update: { ...data },
      create: { id: 1, ...data },
    });
  } catch {
    return redirect('/admin/settings/branding?error=1');
  }

  revalidatePath('/');
  redirect('/admin/settings/branding?saved=1');
}

export default async function BrandingSettingsPage() {
  const current = await (prisma as any).siteSettings.findUnique({ where: { id: 1 } });
  const logoUrl: string = current?.logoUrl ?? '';
  const announcementBar: string = current?.announcementBar ?? 'Limited-time discounts available — book early to save!';

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
        <p className="text-gray-600 mt-1">Manage your site logo and brand assets</p>
      </div>

      <SettingsToast />

      <form action={saveBranding} className="space-y-6">
        <section className="border rounded p-4 space-y-4">
          <h2 className="font-semibold mb-3">Announcement Bar</h2>
          <div className="flex flex-col gap-1">
            <label htmlFor="announcementBar" className="text-sm font-medium text-gray-700">
              Announcement bar text <span className="text-xs text-gray-400">(leave blank to hide)</span>
            </label>
            <input
              id="announcementBar"
              name="announcementBar"
              className="border rounded px-3 py-2"
              placeholder="Limited-time discounts available — book early to save!"
              defaultValue={announcementBar}
            />
          </div>
        </section>

        <section className="border rounded p-4">
          <h2 className="font-semibold mb-3">Logo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
            <div className="flex flex-col gap-1">
              <label htmlFor="logoUrl" className="text-sm font-medium text-gray-700">Site logo image URL</label>
              <input
                id="logoUrl"
                name="logoUrl"
                type="url"
                className="border rounded px-3 py-2"
                placeholder="https://example.com/logo.png"
                defaultValue={logoUrl}
              />
            </div>
            <div className="text-sm text-gray-500 md:col-span-2 flex items-center gap-3">
              <span>Preview:</span>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-8 w-auto border rounded bg-white p-1"
                />
              ) : (
                <span className="text-gray-400">No logo set</span>
              )}
            </div>
          </div>
        </section>

        <div>
          <button type="submit" className="bg-gray-900 text-white rounded px-4 py-2">
            Save branding
          </button>
        </div>
      </form>
    </div>
  );
}
