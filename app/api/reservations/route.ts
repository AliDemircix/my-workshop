import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getIpFromRequest } from '@/lib/rateLimit';
import { Prisma } from '@prisma/client';

const CreateSchema = z.object({
  sessionId: z.number(),
  quantity: z.number().int().min(1).max(10),
  phone: z.string().min(7),
  customerNotes: z.string().max(500).optional(),
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
  const { sessionId, quantity, phone, customerNotes } = parsed.data;

  const sessionExists = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!sessionExists) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  let reservation: Prisma.ReservationGetPayload<Record<string, never>>;
  try {
    // isolationLevel: Serializable is intentionally omitted — SQLite does not support
    // per-transaction isolation levels via Prisma. On Postgres/MySQL, add:
    // { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    reservation = await prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        include: { reservations: true },
      });
      if (!session) throw new Error('SESSION_NOT_FOUND');
      const reserved = session.reservations.reduce(
        (a: number, r: { status: string; quantity: number }) =>
          a + (['CANCELED', 'REFUNDING', 'REFUNDED'].includes(r.status) ? 0 : r.quantity),
        0,
      );
      const remaining = session.capacity - reserved;
      if (quantity > remaining) throw new Error('NOT_ENOUGH_SLOTS');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      return tx.reservation.create({
        data: { sessionId, quantity, name: '', email: '', expiresAt, phone, customerNotes },
      });
    });
  } catch (err: any) {
    if (err?.message === 'NOT_ENOUGH_SLOTS') {
      return NextResponse.json({ error: 'Not enough slots' }, { status: 409 });
    }
    if (err?.message === 'SESSION_NOT_FOUND') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json(reservation, { status: 201 });
}
