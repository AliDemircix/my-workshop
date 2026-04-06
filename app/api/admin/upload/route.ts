import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/slug';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED_FOLDERS = ['slider', 'categories', 'branding'] as const;
type Folder = (typeof ALLOWED_FOLDERS)[number];

export async function POST(req: NextRequest) {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const rawFolder = (formData.get('folder') as string | null) ?? 'slider';
  const rawName = (formData.get('name') as string | null) ?? '';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP and GIF images are allowed' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File size must be under 4 MB' }, { status: 400 });
  }

  const folder: Folder = ALLOWED_FOLDERS.includes(rawFolder as Folder)
    ? (rawFolder as Folder)
    : 'slider';

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';

  // SEO-friendly filename: slugified name + timestamp
  const namePart = rawName ? slugify(rawName) : '';
  const filename = namePart
    ? `${namePart}-${Date.now()}.${ext}`
    : `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (err: any) {
    console.error('[upload] mkdir failed:', uploadDir, err?.message);
    return NextResponse.json({ error: `Cannot create upload directory: ${err?.message}` }, { status: 500 });
  }
  const filePath = join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    await writeFile(filePath, buffer);
  } catch (err: any) {
    console.error('[upload] writeFile failed:', filePath, err?.message);
    return NextResponse.json({ error: `Cannot write file: ${err?.message}` }, { status: 500 });
  }

  return NextResponse.json({ url: `/uploads/${folder}/${filename}` });
}
