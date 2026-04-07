import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { validateReviewToken } from '@/lib/reviewToken';
import { z } from 'zod';

const CreateSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(200),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  if (!json) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { token, name, rating, text } = parsed.data;

  const payload = validateReviewToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired review token' }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: payload.reservationId },
    include: { session: { include: { category: true } } },
  });

  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }

  if (reservation.status !== 'PAID') {
    return NextResponse.json({ error: 'Reviews can only be submitted for completed reservations' }, { status: 400 });
  }

  // Check if review already exists
  const existing = await prisma.review.findUnique({ where: { reservationId: reservation.id } });
  if (existing) {
    return NextResponse.json({ error: 'A review has already been submitted for this reservation' }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      reservationId: reservation.id,
      categoryId: reservation.session.categoryId,
      name: name.trim(),
      rating,
      text: text.trim(),
      approved: false,
    },
  });

  return NextResponse.json({ success: true, id: review.id }, { status: 201 });
}

export async function GET(req: NextRequest) {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const approvedFilter = searchParams.get('approved');

  const reviews = await prisma.review.findMany({
    where: approvedFilter !== null ? { approved: approvedFilter === 'true' } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { id: true, name: true } },
      reservation: {
        select: {
          id: true,
          name: true,
          email: true,
          session: { select: { date: true } },
        },
      },
    },
  });

  return NextResponse.json(reviews);
}
