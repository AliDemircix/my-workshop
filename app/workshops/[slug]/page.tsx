import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { slugify } from '@/lib/slug';
import { getLocale } from 'next-intl/server';
import WorkshopDetail from '@/components/workshop/WorkshopDetail';

export default async function WorkshopDetailPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  if (!slug) return notFound();

  let category = await (prisma.category as any).findFirst({
    where: { slug },
    include: { photos: { orderBy: { position: 'asc' } } },
  });
  if (!category) {
    const all = await prisma.category.findMany();
    const match = all.find((c: any) => slugify(c.name) === slug);
    if (!match) return notFound();
    await prisma.category.update({ where: { id: match.id }, data: ({ slug } as any) });
    category = match;
  }

  const locale = await getLocale();

  function pick(nl: string | null, en: string | null, tr: string | null) {
    if (locale === 'en') return en ?? nl ?? null;
    if (locale === 'tr') return tr ?? nl ?? null;
    return nl ?? null;
  }

  const resolvedDescription    = pick(category.description,    category.descriptionEn,    category.descriptionTr);
  const resolvedLongDescription = pick(category.longDescription, category.longDescriptionEn, category.longDescriptionTr);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{category.name}</h1>
      <WorkshopDetail category={{ ...category, description: resolvedDescription, longDescription: resolvedLongDescription }} />
    </div>
  );
}
