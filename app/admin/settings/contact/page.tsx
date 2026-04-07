import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/auth';
import SettingsToast from '@/components/admin/SettingsToast';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';

async function saveContact(formData: FormData) {
  'use server';
  requireAdminAction();
  const get = (k: string) => String(formData.get(k) ?? '').trim();

  const emailOk = (v: string) => v === '' || /.+@.+\..+/.test(v);
  let email = get('email');
  if (!emailOk(email)) {
    email = '';
  }

  const data = {
    email,
    telephone: get('telephone'),
    address: get('address'),
    kvk: get('kvk'),
    iban: get('iban'),
  };

  try {
    await (prisma as any).siteSettings.upsert({
      where: { id: 1 },
      update: { ...data },
      create: { id: 1, ...data },
    });
  } catch {
    return redirect('/admin/settings/contact?error=1');
  }

  logAction('SETTINGS_SAVED', 'SiteSettings', '1', { section: 'contact' });
  revalidatePath('/');
  redirect('/admin/settings/contact?saved=1');
}

export default async function ContactSettingsPage() {
  const current = await (prisma as any).siteSettings.findUnique({ where: { id: 1 } });

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Contact Info</h1>
        <p className="text-gray-600 mt-1">Manage the contact details shown on your site</p>
      </div>

      <SettingsToast />

      <form action={saveContact} className="space-y-6">
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-3">Contact Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="border rounded px-3 py-2"
                placeholder="contact@example.com"
                defaultValue={current?.email ?? ''}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="telephone" className="text-sm font-medium text-gray-700">Telephone</label>
              <input
                id="telephone"
                name="telephone"
                className="border rounded px-3 py-2"
                placeholder="+31 6 12345678"
                defaultValue={current?.telephone ?? ''}
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="address" className="text-sm font-medium text-gray-700">Address</label>
              <input
                id="address"
                name="address"
                className="border rounded px-3 py-2"
                placeholder="Street, City, Country"
                defaultValue={current?.address ?? ''}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="kvk" className="text-sm font-medium text-gray-700">KVK</label>
              <input
                id="kvk"
                name="kvk"
                className="border rounded px-3 py-2"
                placeholder="KVK number"
                defaultValue={current?.kvk ?? ''}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="iban" className="text-sm font-medium text-gray-700">IBAN</label>
              <input
                id="iban"
                name="iban"
                className="border rounded px-3 py-2"
                placeholder="NL00 BANK 0000 0000 00"
                defaultValue={current?.iban ?? ''}
              />
            </div>
          </div>
        </section>

        <div>
          <button type="submit" className="bg-gray-900 text-white rounded px-4 py-2">
            Save contact info
          </button>
        </div>
      </form>
    </div>
  );
}
