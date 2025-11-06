import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DeleteCategoryButton from '@/components/admin/DeleteCategoryButton';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import EditorField from '@/components/admin/EditorField';
import ClientOnly from '@/components/ClientOnly';
import sanitizeHtml from 'sanitize-html';
import { slugify } from '@/lib/slug';

export default async function CategoriesPage({ searchParams }: { searchParams?: { error?: string } }) {
  async function createCategory(formData: FormData) {
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
    // Ensure unique slug
    const base = slugify(name);
    let candidate = base || null;
    if (candidate) {
      let suffix = 1;
      while (await (prisma.category as any).findFirst({ where: { slug: candidate } })) {
        suffix += 1;
        candidate = `${base}-${suffix}`;
      }
    }
    await prisma.category.create({ data: ({ name, slug: candidate, description, imageUrl } as any) });
    revalidatePath('/admin/categories');
    redirect('/admin/categories');
  }

  async function deleteCategory(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    if (!id) redirect('/admin/categories?error=Invalid%20category');
    const count = await prisma.session.count({ where: { categoryId: id } });
    if (count > 0) {
      redirect('/admin/categories?error=Cannot%20delete%20a%20category%20with%20sessions');
    }
    await prisma.category.delete({ where: { id } });
    revalidatePath('/admin/categories');
    redirect('/admin/categories');
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { sessions: true } } },
  });
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-600 mt-1">Manage workshop categories and their basic information</p>
      </div>
      
      {searchParams?.error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Add New Category</h2>
        <form action={createCategory} className="space-y-4 border rounded p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          <div className="md:col-span-1">
            <input className="border rounded px-3 py-2 w-full" name="name" placeholder="Category name" />
          </div>
          <div className="md:col-span-2">
            <input className="border rounded px-3 py-2 w-full" name="imageUrl" placeholder="Image URL (optional)" />
          </div>
        </div>
        <div>
          <ClientOnly>
            <EditorField name="description" label="Description (optional)" placeholder="Write a description..." />
          </ClientOnly>
        </div>
        <div>
          <button className="bg-gray-900 text-white rounded px-4 py-2">Add</button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-md overflow-hidden">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm">
              <th className="px-3 py-2 border-b">Image</th>
              <th className="px-3 py-2 border-b">Name</th>
              <th className="px-3 py-2 border-b">Description</th>
              <th className="px-3 py-2 border-b">Created</th>
              <th className="px-3 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((c: { id: number; name: string; description?: string | null; imageUrl?: string | null; createdAt?: Date; _count?: { sessions: number } }) => (
              <tr key={c.id} className="text-sm hover:bg-gray-50">
                <td className="px-3 py-2">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.name} className="h-10 w-14 object-cover rounded border" />
                  ) : (
                    <div className="h-10 w-14 rounded border bg-gray-100" />
                  )}
                </td>
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2 max-w-xs truncate" title={c.description ?? ''}>{c.description ? c.description.replace(/<[^>]+>/g, '') : '-'}</td>
                <td className="px-3 py-2">{c?.createdAt ? new Date(c.createdAt).toDateString() : '-'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/categories/${c.id}`}
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      title="Edit category"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M5.433 13.917l-1.354.339a.75.75 0 01-.904-.904l.339-1.354a2.25 2.25 0 01.592-1.09l6.82-6.82a2.25 2.25 0 113.182 3.182l-6.82 6.82a2.25 2.25 0 01-1.09.592z" />
                        <path d="M3.25 15.25h13.5a.75.75 0 010 1.5H3.25a.75.75 0 010-1.5z" />
                      </svg>
                      <span className="sr-only">Edit</span>
                    </Link>
                    <DeleteCategoryButton
                      id={c.id}
                      action={deleteCategory}
                      disabled={(c._count?.sessions || 0) > 0}
                      title={c._count?.sessions ? 'Cannot delete category with sessions' : 'Delete category'}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="text-sm text-gray-600">
        Total categories: <span className="font-semibold">{categories.length}</span>
      </div>
    </div>
    </div>
  );
}
