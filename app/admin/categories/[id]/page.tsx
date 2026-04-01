import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';
import { slugify } from '@/lib/slug';
import { requireAdminAction } from '@/lib/auth';
import EditCategoryForm from '@/components/admin/EditCategoryForm';

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
    // Return to categories list — the client form will show a success toast
    // before navigating (task 35).
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
        <p className="text-gray-600 mt-1">{category.name}</p>
      </div>

      {/* EditCategoryForm is a client component that handles:
          - UnsavedChangesGuard (task 20)
          - Success toast after saving (task 35)
          - Disabled submit button during submission (task 42)
          - focus-visible styles on all inputs (task 36) */}
      <EditCategoryForm category={category} action={updateCategory} />
    </div>
  );
}
