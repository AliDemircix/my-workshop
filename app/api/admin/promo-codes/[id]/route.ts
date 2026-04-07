import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const UpdateSchema = z.object({
  code: z.string().min(1).max(100).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_EUR']).optional(),
  value: z.number().positive().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const json = await req.json().catch(() => null);
  if (!json) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { code, type, value, maxUses, validFrom, validUntil, categoryId } = parsed.data;

  if (code) {
    const conflict = await prisma.promoCode.findFirst({
      where: { code: code.toUpperCase(), id: { not: id } },
    });
    if (conflict) {
      return NextResponse.json({ error: 'A promo code with this code already exists' }, { status: 409 });
    }
  }

  const updated = await prisma.promoCode.update({
    where: { id },
    data: {
      ...(code !== undefined ? { code: code.toUpperCase() } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(value !== undefined ? { value } : {}),
      ...(maxUses !== undefined ? { maxUses } : {}),
      ...(validFrom !== undefined ? { validFrom: validFrom ? new Date(validFrom) : null } : {}),
      ...(validUntil !== undefined ? { validUntil: validUntil ? new Date(validUntil) : null } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  await prisma.promoCode.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
