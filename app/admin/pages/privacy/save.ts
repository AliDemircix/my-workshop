"use server";
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';

export async function savePrivacy(formData: FormData) {
  const raw = String(formData.get('privacyContent') ?? '');
  const content = sanitizeHtml(raw, {
    allowedTags: [
      'h1','h2','h3','h4','h5','h6',
      'p','strong','em','u','s','blockquote','code','pre','span',
      'ul','ol','li','br','hr',
      'a'
    ],
    allowedAttributes: {
      a: ['href','title','target','rel'],
      span: ['style'],
      p: ['style'],
      h1: ['style'], h2: ['style'], h3: ['style'], h4: ['style'], h5: ['style'], h6: ['style']
    },
    allowedSchemes: ['http','https','mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true)
    }
  }).trim();
  try {
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: { privacyContent: content },
      create: { id: 1, privacyContent: content },
    });
  } catch (e) {
    return redirect('/admin/pages/privacy?error=1');
  }
  revalidatePath('/privacy-policy');
  redirect('/admin/pages/privacy?saved=1');
}
