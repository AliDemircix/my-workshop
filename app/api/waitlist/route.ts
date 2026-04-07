import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateSchema = z.object({
  sessionId: z.number().int().positive(),
  email: z.string().email(),
  name: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sessionId, email, name } = parsed.data;

  // Verify session exists
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { reservations: true },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Verify session is actually sold out
  const reserved = session.reservations.reduce(
    (sum, r) =>
      sum + (['CANCELED', 'REFUNDING', 'REFUNDED'].includes(r.status) ? 0 : r.quantity),
    0,
  );
  const remaining = session.capacity - reserved;

  if (remaining > 0) {
    return NextResponse.json({ error: 'Session still has available spots' }, { status: 409 });
  }

  // Prevent duplicate entries for same email + session
  const existing = await prisma.waitlist.findFirst({
    where: { sessionId, email },
  });

  if (existing) {
    return NextResponse.json({ error: 'Already on the waitlist for this session' }, { status: 409 });
  }

  const entry = await prisma.waitlist.create({
    data: { sessionId, email, name },
  });

  return NextResponse.json(entry, { status: 201 });
}
