import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getIpFromRequest } from '@/lib/rateLimit';

const CreateSchema = z.object({
  sessionId: z.number(),
  quantity: z.number().int().min(1).max(10),
});

// 10 requests per hour per IP
const RESERVATIONS_LIMIT = 10;
const RESERVATIONS_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);
  const rateLimitResult = checkRateLimit(ip, 'reservations', RESERVATIONS_LIMIT, RESERVATIONS_WINDOW_MS);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfterSeconds),
          'X-RateLimit-Limit': String(RESERVATIONS_LIMIT),
          'X-RateLimit-Window': '3600',
        },
      },
    );
  }

  const json = await req.json();
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { sessionId, quantity } = parsed.data;

  const session = await prisma.session.findUnique({ 
    where: { id: sessionId }, 
    include: { 
      reservations: true,
      category: true
    } 
  });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  const reserved = session.reservations.reduce((a: number, r: { status: string; quantity: number }) => a + (['CANCELED', 'REFUNDING', 'REFUNDED'].includes(r.status) ? 0 : r.quantity), 0);
  const remaining = session.capacity - reserved;
  if (quantity > remaining) return NextResponse.json({ error: 'Not enough slots' }, { status: 409 });

  const reservation = await prisma.reservation.create({
    data: { sessionId, quantity, name: '', email: '' },
  });


  return NextResponse.json(reservation, { status: 201 });
}
