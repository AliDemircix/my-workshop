import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const { count } = await prisma.reservation.updateMany({
    where: { status: 'PENDING', expiresAt: { lt: now } },
    data: { status: 'CANCELED', canceledAt: now },
  });

  return NextResponse.json({ canceled: count });
}
