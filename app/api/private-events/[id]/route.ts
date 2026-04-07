import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendPrivateEventClosedEmail } from '@/lib/mailer';
import { z } from 'zod';

const UpdateSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'CLOSED']),
  closingMessage: z.string().optional(),
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

  const existing = await prisma.privateEventRequest.findUnique({
    where: { id },
    include: { category: { select: { name: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.privateEventRequest.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  // Send notification email when status transitions to CLOSED
  if (parsed.data.status === 'CLOSED' && existing.status !== 'CLOSED') {
    try {
      await sendPrivateEventClosedEmail({
        to: existing.email,
        customerName: existing.name,
        categoryName: existing.category?.name,
        message: parsed.data.closingMessage,
      });
    } catch (err) {
      console.error(`Failed to send closing email for private event ${id}:`, err);
      // Non-fatal: status is already updated, log and continue
    }
  }

  return NextResponse.json(updated);
}
