import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/auth';
import SettingsToast from '@/components/admin/SettingsToast';
import SliderImagesEditor from '@/components/admin/SliderImagesEditor';

export const dynamic = 'force-dynamic';

async function saveSlider(formData: FormData) {
  'use server';
  requireAdminAction();
  const addHttps = (v: string) =>
    v && !/^(?:https?:\/\/|\/)/.test(v) ? `https://${v}` : v;

  const images = formData
    .getAll('sliderImages')
    .map((v) => String(v ?? '').trim())
    .filter((u) => u.length > 0)
    .map((u) => addHttps(u));

  try {
    await prisma.$transaction(async (txRaw) => {
      const tx = txRaw as any;
      await tx.siteSettings.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1 },
      });
      await tx.siteSliderImage.deleteMany({ where: { siteSettingsId: 1 } });
      if (images.length > 0) {
        await tx.siteSliderImage.createMany({
          data: images.map((url, idx) => ({ url, position: idx, siteSettingsId: 1 })),
        });
      }
    });
  } catch {
    return redirect('/admin/settings/slider?error=1');
  }

  revalidatePath('/');
  redirect('/admin/settings/slider?saved=1');
}

export default async function SliderSettingsPage() {
  const images: { url: string }[] = await (prisma as any).siteSliderImage.findMany({
    where: { siteSettingsId: 1 },
    orderBy: { position: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Slider Images</h1>
        <p className="text-gray-600 mt-1">
          Manage the images shown in the Reserve page slider
        </p>
      </div>

      <SettingsToast />

      <form action={saveSlider} className="space-y-6">
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-3">Reserve Page Slider Images</h2>
          <p className="text-sm text-gray-600 mb-3">
            These images will be shown under the selected workshop&apos;s description on the Reserve page.
          </p>
          <SliderImagesEditor initial={images.map((i) => i.url)} />
        </section>

        <div>
          <button type="submit" className="bg-gray-900 text-white rounded px-4 py-2">
            Save slider images
          </button>
        </div>
      </form>
    </div>
  );
}
