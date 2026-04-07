import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const PromoCodeSchema = z.object({
  code: z.string().min(1).max(100),
  type: z.enum(['PERCENTAGE', 'FIXED_EUR']),
  value: z.number().positive(),
  maxUses: z.number().int().positive().nullable().optional(),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
});

export async function GET() {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json(codes);
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  if (!json) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = PromoCodeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { code, type, value, maxUses, validFrom, validUntil, categoryId } = parsed.data;

  const existing = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (existing) {
    return NextResponse.json({ error: 'A promo code with this code already exists' }, { status: 409 });
  }

  const promo = await prisma.promoCode.create({
    data: {
      code: code.toUpperCase(),
      type,
      value,
      maxUses: maxUses ?? null,
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      categoryId: categoryId ?? null,
    },
  });

  return NextResponse.json(promo, { status: 201 });
}
