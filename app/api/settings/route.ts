import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const s = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const images: { url: string }[] = s ? await (prisma as any).siteSliderImage.findMany({ where: { siteSettingsId: s.id }, orderBy: { position: 'asc' } }) : [];
  const urls = images.map((x) => x.url);
  return NextResponse.json({ sliderImages: urls, logoUrl: (s as any)?.logoUrl ?? null });
}
