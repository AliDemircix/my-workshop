import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
// Short revalidation so middleware cache stays fresh without hammering the DB.
export const revalidate = 15;

export async function GET() {
  try {
    const s = await (prisma as any).siteSettings.findUnique({ where: { id: 1 } });
    return NextResponse.json(
      { active: s?.maintenanceMode ?? false },
      {
        headers: {
          // Allow Next.js Data Cache to cache this for 15 seconds.
          'Cache-Control': 's-maxage=15, stale-while-revalidate=5',
        },
      }
    );
  } catch {
    // If DB is unreachable, fail open — never block public traffic due to a DB error.
    return NextResponse.json({ active: false });
  }
}
