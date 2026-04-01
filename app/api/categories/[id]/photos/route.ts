import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categoryId = Number(params.id);
  if (!categoryId) {
    return NextResponse.json({ error: 'Invalid category id' }, { status: 400 });
  }

  const body = await req.json() as { url?: string };
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  // Confirm the category exists
  const category = await (prisma.category as any).findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  // Assign position = current max + 1 so new photos append to the end
  const last = await (prisma as any).categoryPhoto.findFirst({
    where: { categoryId },
    orderBy: { position: 'desc' },
  });
  const position = last ? (last.position as number) + 1 : 0;

  const photo = await (prisma as any).categoryPhoto.create({
    data: { categoryId, url, position },
  });

  return NextResponse.json(photo, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categoryId = Number(params.id);
  if (!categoryId) {
    return NextResponse.json({ error: 'Invalid category id' }, { status: 400 });
  }

  const body = await req.json() as { url?: string };
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  // Find the DB record first to make sure it belongs to this category
  const photo = await (prisma as any).categoryPhoto.findFirst({
    where: { categoryId, url },
  });
  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  // Delete DB record
  await (prisma as any).categoryPhoto.delete({ where: { id: photo.id } });

  // Delete file from disk — only files inside /uploads/categories/ are managed
  if (/^\/uploads\/categories\//.test(url)) {
    const filename = url.split('/')[3]?.split('?')[0] ?? '';
    if (filename && !filename.includes('..')) {
      const filePath = join(process.cwd(), 'public', 'uploads', 'categories', filename);
      try {
        await unlink(filePath);
      } catch {
        // File may already be gone — not fatal
      }
    }
  }

  return NextResponse.json({ ok: true });
}
