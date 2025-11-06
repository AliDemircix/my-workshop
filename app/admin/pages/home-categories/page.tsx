import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import ClientOnly from '@/components/ClientOnly';
import EditorField from '@/components/admin/EditorField';
import sanitizeHtml from 'sanitize-html';
import HomeCategoriesTabs from '../../../../components/admin/HomeCategoriesTabs';
import PolicyToast from '@/components/admin/PolicyToast';

export default async function HomeCategoriesPage() {
  const categories = (await prisma.category.findMany({ orderBy: { name: 'asc' } })) as any[];

  async function save(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    const imageUrl = String(formData.get('imageUrl') || '').trim() || null;
    const shortRaw = String(formData.get('shortDescription') || '').trim();
    const shortDescription = shortRaw
      ? sanitizeHtml(shortRaw, {
          allowedTags: ['h1','h2','h3','h4','h5','h6','p','strong','em','u','s','blockquote','code','pre','span','ul','ol','li','br','hr','a'],
          allowedAttributes: { a: ['href','title','target','rel'], span: ['style'], p: ['style'], h1: ['style'], h2: ['style'], h3: ['style'], h4: ['style'], h5: ['style'], h6: ['style'] },
          allowedSchemes: ['http','https','mailto'],
          allowProtocolRelative: false,
          transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true) }
        }).trim()
      : null;
    const longRaw = String(formData.get('longDescription') || '').trim();
    const longDescription = longRaw
      ? sanitizeHtml(longRaw, {
          allowedTags: ['h1','h2','h3','h4','h5','h6','p','strong','em','u','s','blockquote','code','pre','span','ul','ol','li','br','hr','a','img'],
          allowedAttributes: { a: ['href','title','target','rel'], img: ['src','alt','title','width','height'], span: ['style'], p: ['style'], h1: ['style'], h2: ['style'], h3: ['style'], h4: ['style'], h5: ['style'], h6: ['style'] },
          allowedSchemes: ['http','https','mailto'],
          allowProtocolRelative: false,
          transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true) }
        }).trim()
      : null;

    if (!id) {
      redirect('/admin/pages/home-categories?error=' + encodeURIComponent('Missing category id'));
    }
    try {
      await prisma.category.update({ where: { id }, data: ({ imageUrl, description: shortDescription, longDescription } as any) });
    } catch (e) {
      redirect('/admin/pages/home-categories?error=1');
    }
    // Best-effort revalidation; do not fail the save if this throws
    try {
      revalidatePath('/admin/pages/home-categories');
    } catch {}
    redirect('/admin/pages/home-categories?saved=1');
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Home Categories</h1>
        <p className="text-gray-600 mt-1">Manage the cards shown under the slider on the home page and the content of each workshop detail page</p>
      </div>
      
      <PolicyToast successMessage="Category saved" errorMessage="Could not save category" />
      <HomeCategoriesTabs categories={categories} save={save} />
    </div>
  );
}
