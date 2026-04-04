import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { z } from 'zod';

const availabilitySchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  month: z.coerce.number().int().min(0).max(11),
  year: z.coerce.number().int().min(2020).max(2100),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = availabilitySchema.safeParse({
    categoryId: searchParams.get('categoryId'),
    month: searchParams.get('month'),
    year: searchParams.get('year'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }
  const { categoryId, month, year } = parsed.data;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const sessions = await prisma.session.findMany({
    where: { categoryId, date: { gte: start, lte: end } },
    include: { reservations: true },
  });

  type TimeInfo = { id: number; start: string; end: string; priceCents: number; remaining: number };
  const byDate: Record<string, { remaining: number; times: TimeInfo[] }> = {};
  for (const s of sessions) {
    const dateKey = format(s.date, 'yyyy-MM-dd');
  const reserved = s.reservations.reduce((a: number, r: { status: string; quantity: number }) => a + (['CANCELED', 'REFUNDING', 'REFUNDED'].includes(r.status) ? 0 : r.quantity), 0);
    const remaining = Math.max(0, s.capacity - reserved);
    const time: TimeInfo = { id: s.id, start: s.startTime.toISOString(), end: s.endTime.toISOString(), priceCents: s.priceCents, remaining };
    if (!byDate[dateKey]) byDate[dateKey] = { remaining: 0, times: [] };
    byDate[dateKey].remaining += remaining;
    byDate[dateKey].times.push(time);
  }

  return NextResponse.json(byDate);
}
