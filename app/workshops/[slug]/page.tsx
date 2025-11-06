import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { slugify } from '@/lib/slug';
import WorkshopDetail from '@/components/workshop/WorkshopDetail';

export default async function WorkshopDetailPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  if (!slug) return notFound();

  // Try to find by slug
  let category = await (prisma.category as any).findFirst({ where: { slug } });
  if (!category) {
    // Try backfill: match by normalized name
    const all = await prisma.category.findMany();
    const match = all.find((c: any) => slugify(c.name) === slug);
    if (!match) return notFound();
    // Persist slug for future
    await prisma.category.update({ where: { id: match.id }, data: ({ slug } as any) });
    category = match;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{category.name}</h1>
      <WorkshopDetail category={category as any} />
    </div>
  );
}
