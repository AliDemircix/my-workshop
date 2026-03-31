import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import EditorField from '@/components/admin/EditorField';
import ClientOnly from '@/components/ClientOnly';
import CategoryImageUploader from '@/components/admin/CategoryImageUploader';
import sanitizeHtml from 'sanitize-html';
import { slugify } from '@/lib/slug';
import { requireAdminAction } from '@/lib/auth';

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return notFound();

  const category = await (prisma.category as any).findUnique({ where: { id } });
  if (!category) return notFound();

  async function updateCategory(formData: FormData) {
    'use server';
    requireAdminAction();
    const name = String(formData.get('name') || '').trim();
    const rawDescription = String(formData.get('description') || '').trim();
    const description = rawDescription
      ? sanitizeHtml(rawDescription, {
          allowedTags: ['h1','h2','h3','h4','h5','h6','p','strong','em','u','s','blockquote','code','pre','span','ul','ol','li','br','hr','a'],
          allowedAttributes: { a: ['href','title','target','rel'], span: ['style'], p: ['style'], h1: ['style'], h2: ['style'], h3: ['style'], h4: ['style'], h5: ['style'], h6: ['style'] },
          allowedSchemes: ['http','https','mailto'],
          allowProtocolRelative: false,
          transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true) }
        }).trim()
      : null;
    const imageUrl      = String(formData.get('imageUrl')      || '').trim() || null;
    const imageAlt      = String(formData.get('imageAlt')      || '').trim() || null;
    const imageCaption  = String(formData.get('imageCaption')  || '').trim() || null;
    const imageTitle    = String(formData.get('imageTitle')    || '').trim() || null;
    if (!name) return;

    let nextSlug: string | null = category.slug ?? null;
    if (!nextSlug || name !== category.name) {
      const base = slugify(name);
      let candidate: string | null = base || null;
      if (candidate) {
        let suffix = 1;
        while (true) {
          const existing = await (prisma.category as any).findFirst({ where: { slug: candidate } });
          if (!existing || existing.id === id) break;
          suffix += 1;
          candidate = `${base}-${suffix}`;
        }
      }
      nextSlug = candidate;
    }

    await (prisma.category as any).update({
      where: { id },
      data: { name, description, imageUrl, imageAlt, imageCaption, imageTitle, slug: nextSlug },
    });
    revalidatePath('/admin/categories');
    redirect('/admin/categories');
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
        <p className="text-gray-600 mt-1">{category.name}</p>
      </div>

      <form action={updateCategory} className="space-y-6 border rounded p-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: image upload */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Category Image</label>
            <ClientOnly>
              <CategoryImageUploader
                initialUrl={category.imageUrl}
                categoryName={category.name}
              />
            </ClientOnly>
          </div>

          {/* Right: name + SEO fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                className="border rounded px-3 py-2 w-full"
                name="name"
                defaultValue={category.name}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Alt Text <span className="text-xs text-gray-400">(SEO — describes the image for search engines)</span>
              </label>
              <input
                className="border rounded px-3 py-2 w-full"
                name="imageAlt"
                defaultValue={category.imageAlt ?? ''}
                placeholder="e.g. Colourful epoxy resin pour workshop"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Title <span className="text-xs text-gray-400">(shown as tooltip on hover)</span>
              </label>
              <input
                className="border rounded px-3 py-2 w-full"
                name="imageTitle"
                defaultValue={category.imageTitle ?? ''}
                placeholder="e.g. Epoxy Pour Workshop — Giftoria"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Caption <span className="text-xs text-gray-400">(shown below image on the public page)</span>
              </label>
              <input
                className="border rounded px-3 py-2 w-full"
                name="imageCaption"
                defaultValue={category.imageCaption ?? ''}
                placeholder="e.g. Participants creating epoxy art"
              />
            </div>
          </div>
        </div>

        <div>
          <ClientOnly>
            <EditorField
              name="description"
              label="Description"
              defaultValue={category.description ?? ''}
              placeholder="Write a description..."
            />
          </ClientOnly>
        </div>

        <div className="flex gap-3 pt-2 border-t">
          <button className="bg-gray-900 text-white rounded px-4 py-2">Save Changes</button>
          <a href="/admin/categories" className="underline text-gray-600 self-center">Cancel</a>
        </div>
      </form>
    </div>
  );
}
