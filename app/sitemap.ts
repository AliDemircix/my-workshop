import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Static public pages — lastModified reflects the last known content update date
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date('2026-04-01'), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/reserve`, lastModified: new Date('2026-03-01'), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/gift-voucher`, lastModified: new Date('2026-03-01'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/faq`, lastModified: new Date('2026-03-01'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date('2026-03-01'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/private-event`, lastModified: new Date('2026-04-01'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date('2025-09-18'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/refund`, lastModified: new Date('2025-09-18'), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Dynamic workshop category pages
  const categories = await prisma.category.findMany({
    select: { slug: true, name: true, updatedAt: true },
  });

  const dynamicRoutes: MetadataRoute.Sitemap = categories
    .map((cat) => {
      const slug = (cat as any).slug ?? cat.name.toLowerCase().replace(/\s+/g, '-');
      return {
        url: `${baseUrl}/workshops/${slug}`,
        lastModified: (cat as any).updatedAt ?? new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      };
    });

  return [...staticRoutes, ...dynamicRoutes];
}
