import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import EditorField from '@/components/admin/EditorField';
import ClientOnly from '@/components/ClientOnly';
import sanitizeHtml from 'sanitize-html';
import { slugify } from '@/lib/slug';

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return notFound();

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return notFound();

  async function updateCategory(formData: FormData) {
    'use server';
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
    const imageUrl = String(formData.get('imageUrl') || '').trim() || null;
    if (!name) return;
    // Compute slug if needed (name changed or slug missing), ensure uniqueness
  let nextSlug: string | null | undefined = (category as any).slug ?? null;
  if (!nextSlug || name !== (category as any).name) {
      const base = slugify(name);
      let candidate = base || null;
      if (candidate) {
        let suffix = 1;
        // ensure not used by other categories
        // use findFirst to avoid strict unique type requirements
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const existing = await (prisma.category as any).findFirst({ where: { slug: candidate } });
          if (!existing || existing.id === id) break;
          suffix += 1;
          candidate = `${base}-${suffix}`;
        }
      }
      nextSlug = candidate;
    }
    await prisma.category.update({ where: { id }, data: ({ name, description, imageUrl, slug: nextSlug } as any) });
    revalidatePath('/admin/categories');
    redirect('/admin/categories');
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Edit Category</h2>
      <form action={updateCategory} className="space-y-4 border rounded p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          <div className="md:col-span-1">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input className="border rounded px-3 py-2 w-full" name="name" defaultValue={category.name} />
          </div>
          <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input className="border rounded px-3 py-2 w-full" name="imageUrl" defaultValue={category.imageUrl ?? ''} />
          </div>
        </div>
        <div>
          <ClientOnly>
            <EditorField name="description" label="Description" defaultValue={category.description ?? ''} placeholder="Write a description..." />
          </ClientOnly>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-900 text-white rounded px-4 py-2">Save</button>
          <a href="/admin/categories" className="underline">Cancel</a>
        </div>
      </form>
    </div>
  );
}
