import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateSchema = z.object({
  sessionId: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  quantity: z.number().int().min(1).max(10),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { sessionId, name, email, quantity } = parsed.data;

  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { reservations: true } });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  const reserved = session.reservations.reduce((a: number, r: { status: string; quantity: number }) => a + (r.status === 'CANCELED' ? 0 : r.quantity), 0);
  const remaining = session.capacity - reserved;
  if (quantity > remaining) return NextResponse.json({ error: 'Not enough slots' }, { status: 409 });

  const reservation = await prisma.reservation.create({
    data: { sessionId, name, email, quantity },
  });
  return NextResponse.json(reservation, { status: 201 });
}
