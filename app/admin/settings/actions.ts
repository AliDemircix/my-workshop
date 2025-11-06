"use server";
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function saveSettings(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? '').trim();
  const getAll = (k: string) => formData.getAll(k).map((v) => String(v ?? '').trim());
  // Trim all inputs and coerce sensible defaults for policy items
  const data = {
    id: 1,
    privacyLabel: get('privacyLabel') || 'Privacy Policy',
    privacyUrl: '/privacy-policy',
    contactLabel: get('contactLabel') || 'Contact',
    contactUrl: 'https://www.giftoria.nl/contact-us',
    refundLabel: get('refundLabel') || 'Refund Policy',
    refundUrl: '/refund',
    facebookUrl: get('facebookUrl'),
    instagramUrl: get('instagramUrl'),
    youtubeUrl: get('youtubeUrl'),
    email: get('email'),
    telephone: get('telephone'),
    address: get('address'),
    kvk: get('kvk'),
    iban: get('iban'),
    logoUrl: get('logoUrl'),
  };

  // Page URLs are hard-coded as above; no normalization required

  // Normalize social URLs: if provided without scheme, prefix with https://
  const addHttps = (v: string) => (v && !/^https?:\/\//.test(v) ? `https://${v}` : v);
  data.facebookUrl = addHttps(data.facebookUrl);
  data.instagramUrl = addHttps(data.instagramUrl);
  data.youtubeUrl = addHttps(data.youtubeUrl);
  data.logoUrl = addHttps(data.logoUrl);

  const urlOk = (v: string) => v === '' || /^(?:\/|https?:\/\/).+/.test(v);
  const emailOk = (v: string) => v === '' || /.+@.+\..+/.test(v);
  if (!data.privacyLabel || !data.contactLabel || !data.refundLabel) {
    return redirect('/admin/settings?error=1');
  }
  // Page URLs are hard-coded, skip validation
  // Socials are normalized; no need to block on them. If email invalid, clear it instead of failing.
  if (!emailOk(data.email)) {
    data.email = '';
  }

  // Collect slider images, normalize, and filter empties
  const images = getAll('sliderImages')
    .map((u) => u.trim())
    .filter((u) => u.length > 0)
    .map((u) => addHttps(u));
  // Persist settings and slider images transactionally

  // Attempt write; on failure redirect with error
  try {
    await prisma.$transaction(async (txRaw) => {
      const tx = txRaw as any;
      const updateData = {
        privacyLabel: data.privacyLabel,
        privacyUrl: data.privacyUrl,
        contactLabel: data.contactLabel,
        contactUrl: data.contactUrl,
        refundLabel: data.refundLabel,
        refundUrl: data.refundUrl,
        facebookUrl: data.facebookUrl,
        instagramUrl: data.instagramUrl,
        youtubeUrl: data.youtubeUrl,
        email: data.email,
        telephone: data.telephone,
        address: data.address,
        kvk: data.kvk,
        iban: data.iban,
        logoUrl: data.logoUrl,
      };
      const createData = { id: 1, ...updateData };
      await tx.siteSettings.upsert({ where: { id: 1 }, update: updateData, create: createData });
      // Replace existing slider images with current list, preserving order
      await tx.siteSliderImage.deleteMany({ where: { siteSettingsId: 1 } });
      if (images.length > 0) {
        await tx.siteSliderImage.createMany({
          data: images.map((url, idx) => ({ url, position: idx, siteSettingsId: 1 })),
        });
      }
    });
  } catch {
    return redirect('/admin/settings?error=1');
  }
  // Only executed when write succeeds
  revalidatePath('/');
  redirect('/admin/settings?saved=1');
}
