import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

const DEFAULT_MESSAGE =
  "We are currently performing scheduled maintenance. We'll be back shortly!";

export async function GET() {
  const s = await (prisma as any).siteSettings.findUnique({ where: { id: 1 } });
  return NextResponse.json({
    maintenanceMode: s?.maintenanceMode ?? false,
    maintenanceMessage: s?.maintenanceMessage ?? DEFAULT_MESSAGE,
  });
}

export async function POST(request: Request) {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const maintenanceMode = Boolean(body.maintenanceMode);
  const maintenanceMessage =
    typeof body.maintenanceMessage === 'string' && body.maintenanceMessage.trim()
      ? body.maintenanceMessage.trim()
      : DEFAULT_MESSAGE;

  await (prisma as any).siteSettings.upsert({
    where: { id: 1 },
    update: { maintenanceMode, maintenanceMessage },
    create: { id: 1, maintenanceMode, maintenanceMessage },
  });

  const response = NextResponse.json({ maintenanceMode, maintenanceMessage });

  // Persist the maintenance flag as an httpOnly cookie so the Edge middleware
  // can read it without requiring a DB call.
  response.cookies.set('maintenance_mode', maintenanceMode ? '1' : '0', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    // No explicit maxAge — session lifetime is fine; the API always refreshes it.
  });

  return response;
}
