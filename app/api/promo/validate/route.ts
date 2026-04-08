import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ValidateSchema = z.object({
  code: z.string().min(1).max(100),
  categoryId: z.number().int().positive().optional(),
  totalAmountCents: z.number().int().nonnegative(),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  if (!json) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = ValidateSchema.safeParse(json);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? 'Invalid request';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { code, categoryId, totalAmountCents } = parsed.data;
  const normalizedCode = code.trim().toUpperCase();

  const promo = await prisma.promoCode.findUnique({ where: { code: normalizedCode } });

  if (!promo) {
    return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
  }

  const now = new Date();

  if (promo.validFrom && promo.validFrom > now) {
    return NextResponse.json({ error: 'Promo code is not yet valid' }, { status: 400 });
  }

  if (promo.validUntil && promo.validUntil < now) {
    return NextResponse.json({ error: 'Promo code has expired' }, { status: 400 });
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ error: 'Promo code has reached its usage limit' }, { status: 400 });
  }

  // If promo is restricted to a category, enforce it
  if (promo.categoryId !== null && categoryId !== undefined && promo.categoryId !== categoryId) {
    return NextResponse.json({ error: 'Promo code is not valid for this workshop category' }, { status: 400 });
  }

  let discountCents: number;

  if (promo.type === 'PERCENTAGE') {
    discountCents = Math.round((promo.value / 100) * totalAmountCents);
  } else {
    // FIXED_EUR — value is in euros, convert to cents
    discountCents = Math.round(promo.value * 100);
  }

  // Discount cannot exceed the total
  discountCents = Math.min(discountCents, totalAmountCents);
  const finalAmountCents = totalAmountCents - discountCents;

  return NextResponse.json({
    valid: true,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    discountCents,
    finalAmountCents,
  });
}
