import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/auth';
import SettingsToast from '@/components/admin/SettingsToast';

export const dynamic = 'force-dynamic';

async function saveSocial(formData: FormData) {
  'use server';
  requireAdminAction();
  const get = (k: string) => String(formData.get(k) ?? '').trim();
  const addHttps = (v: string) =>
    v && !/^(?:https?:\/\/|\/)/.test(v) ? `https://${v}` : v;

  const data = {
    facebookUrl: addHttps(get('facebookUrl')),
    instagramUrl: addHttps(get('instagramUrl')),
    youtubeUrl: addHttps(get('youtubeUrl')),
  };

  try {
    await (prisma as any).siteSettings.upsert({
      where: { id: 1 },
      update: { ...data },
      create: { id: 1, ...data },
    });
  } catch {
    return redirect('/admin/settings/social?error=1');
  }

  revalidatePath('/');
  redirect('/admin/settings/social?saved=1');
}

export default async function SocialSettingsPage() {
  const current = await (prisma as any).siteSettings.findUnique({ where: { id: 1 } });

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Social Links</h1>
        <p className="text-gray-600 mt-1">Manage the social media links shown in your site footer</p>
      </div>

      <SettingsToast />

      <form action={saveSocial} className="space-y-6">
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-3">Social Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="facebookUrl" className="text-sm font-medium text-gray-700">Facebook URL</label>
              <input
                id="facebookUrl"
                name="facebookUrl"
                type="url"
                className="border rounded px-3 py-2"
                placeholder="https://facebook.com/yourpage"
                defaultValue={current?.facebookUrl ?? ''}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="instagramUrl" className="text-sm font-medium text-gray-700">Instagram URL</label>
              <input
                id="instagramUrl"
                name="instagramUrl"
                type="url"
                className="border rounded px-3 py-2"
                placeholder="https://instagram.com/yourhandle"
                defaultValue={current?.instagramUrl ?? ''}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="youtubeUrl" className="text-sm font-medium text-gray-700">YouTube URL</label>
              <input
                id="youtubeUrl"
                name="youtubeUrl"
                type="url"
                className="border rounded px-3 py-2"
                placeholder="https://youtube.com/yourchannel"
                defaultValue={current?.youtubeUrl ?? ''}
              />
            </div>
          </div>
        </section>

        <div>
          <button type="submit" className="bg-gray-900 text-white rounded px-4 py-2">
            Save social links
          </button>
        </div>
      </form>
    </div>
  );
}
