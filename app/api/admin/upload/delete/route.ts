import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url } = await req.json() as { url: string };

  // Only allow deleting from our managed upload folders
  if (!url || !/^\/uploads\/(slider|categories)\//.test(url)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const parts = url.split('/');
  const folder = parts[2];
  const filename = parts[3]?.split('?')[0] ?? '';
  if (!filename || filename.includes('..')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filePath = join(process.cwd(), 'public', 'uploads', folder, filename);
  try {
    await unlink(filePath);
  } catch {
    // File may already be gone — not fatal
  }

  return NextResponse.json({ ok: true });
}
