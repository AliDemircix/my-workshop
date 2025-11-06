import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { startOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = Number(searchParams.get('categoryId'));
  const month = Number(searchParams.get('month')); // 0-11
  const year = Number(searchParams.get('year'));
  if (!categoryId || isNaN(month) || isNaN(year)) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const sessions = await prisma.session.findMany({
    where: { categoryId, date: { gte: start, lte: end } },
    include: { reservations: true },
  });

  type TimeInfo = { id: number; start: string; end: string; priceCents: number; remaining: number };
  const byDate: Record<string, { remaining: number; times: TimeInfo[] }> = {};
  for (const s of sessions) {
    const dateKey = startOfDay(s.date).toISOString();
  const reserved = s.reservations.reduce((a: number, r: { status: string; quantity: number }) => a + (r.status === 'CANCELED' ? 0 : r.quantity), 0);
    const remaining = Math.max(0, s.capacity - reserved);
    const time: TimeInfo = { id: s.id, start: s.startTime.toISOString(), end: s.endTime.toISOString(), priceCents: s.priceCents, remaining };
    if (!byDate[dateKey]) byDate[dateKey] = { remaining: 0, times: [] };
    byDate[dateKey].remaining += remaining;
    byDate[dateKey].times.push(time);
  }

  return NextResponse.json(byDate);
}
