import { prisma } from '@/lib/prisma';
import SettingsToast from '@/components/admin/SettingsToast';
import { saveSettings } from './actions';
import SliderImagesEditor from '@/components/admin/SliderImagesEditor';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const current = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const images: { url: string }[] = await (prisma as any).siteSliderImage.findMany({ where: { siteSettingsId: 1 }, orderBy: { position: 'asc' } });

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure site settings, branding, contact information, and slider images</p>
      </div>
      
      <SettingsToast />
      <form action={saveSettings} className="space-y-6">
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-3">Policy & Pages</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <input name="privacyLabel" className="border rounded px-3 py-2" placeholder="Privacy label" defaultValue={current?.privacyLabel ?? ''} required />
              <div className="text-sm text-gray-500 md:col-span-2">
                Link is hard-coded to <span className="font-mono">/privacy-policy</span>. Edit content in <a className="underline" href="/admin/pages/privacy">Admin → Privacy page</a>.
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <input name="refundLabel" className="border rounded px-3 py-2" placeholder="Refund label" defaultValue={current?.refundLabel ?? ''} required />
              <div className="text-sm text-gray-500 md:col-span-2">
                Link is hard-coded to <span className="font-mono">/refund</span>. Edit content in <a className="underline" href="/admin/pages/refund">Admin → Refund page</a>.
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <input name="contactLabel" className="border rounded px-3 py-2" placeholder="Contact label" defaultValue={current?.contactLabel ?? ''} required />
              <div className="text-sm text-gray-500 md:col-span-2">
                Contact link is hard-coded to <a className="underline" href="https://www.giftoria.nl/contact-us" target="_blank">https://www.giftoria.nl/contact-us</a>.
              </div>
            </div>
          </div>
        </section>

        <section className="border rounded p-4">
          <h2 className="font-semibold mb-3">Social Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input name="facebookUrl" type="url" className="border rounded px-3 py-2" placeholder="Facebook URL" defaultValue={current?.facebookUrl ?? ''} />
            <input name="instagramUrl" type="url" className="border rounded px-3 py-2" placeholder="Instagram URL" defaultValue={current?.instagramUrl ?? ''} />
            <input name="youtubeUrl" type="url" className="border rounded px-3 py-2" placeholder="YouTube URL" defaultValue={current?.youtubeUrl ?? ''} />
          </div>
        </section>

        <section className="border rounded p-4">
          <h2 className="font-semibold mb-3">Contact Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input name="email" type="email" className="border rounded px-3 py-2" placeholder="Email" defaultValue={current?.email ?? ''} />
            <input name="telephone" className="border rounded px-3 py-2" placeholder="Telephone" defaultValue={current?.telephone ?? ''} />
            <input name="address" className="border rounded px-3 py-2 md:col-span-2" placeholder="Address" defaultValue={current?.address ?? ''} />
            <input name="kvk" className="border rounded px-3 py-2" placeholder="KVK" defaultValue={current?.kvk ?? ''} />
            <input name="iban" className="border rounded px-3 py-2" placeholder="IBAN" defaultValue={current?.iban ?? ''} />
          </div>
        </section>

        <section className="border rounded p-4">
          <h2 className="font-semibold mb-3">Branding</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
            <input name="logoUrl" type="url" className="border rounded px-3 py-2" placeholder="Site logo image URL" defaultValue={(current as any)?.logoUrl ?? ''} />
            <div className="text-sm text-gray-500 md:col-span-2 flex items-center gap-3">
              <span>Preview:</span>
              {(current as any)?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={(current as any)?.logoUrl} alt="Logo preview" className="h-8 w-auto border rounded bg-white p-1" />
              ) : (
                <span className="text-gray-400">No logo set</span>
              )}
            </div>
          </div>
        </section>

        <section className="border rounded p-4">
          <h2 className="font-semibold mb-3">Reserve Page Slider Images</h2>
          <p className="text-sm text-gray-600 mb-3">These images will be shown under the selected workshop’s description on the Reserve page.</p>
          <SliderImagesEditor initial={images.map((i) => i.url)} />
        </section>

        <div>
          <button className="bg-gray-900 text-white rounded px-4 py-2">Save settings</button>
        </div>
      </form>
    </div>
  );
}
