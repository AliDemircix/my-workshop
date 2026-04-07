import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { sendMail, hasSmtpConfig } from '@/lib/mailer';
import { z } from 'zod';

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  groupSize: z.number().int().min(1).max(500),
  preferredDates: z.string().max(500).optional(),
  categoryId: z.number().int().positive().optional(),
  message: z.string().max(2000).optional(),
});

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  if (!json) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, phone, groupSize, preferredDates, categoryId, message } = parsed.data;

  // If categoryId provided, verify it exists
  if (categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const request = await prisma.privateEventRequest.create({
    data: {
      name,
      email,
      phone: phone ?? null,
      groupSize,
      preferredDates: preferredDates ?? null,
      categoryId: categoryId ?? null,
      message: message ?? null,
    },
    include: { category: { select: { name: true } } },
  });

  // Send admin notification email (best-effort)
  if (hasSmtpConfig()) {
    const adminEmail = process.env.SMTP_FROM || process.env.SMTP_USER || '';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    try {
      await sendMail({
        to: adminEmail,
        subject: `New private event inquiry from ${name}`,
        html: `
          <h2>New Private Event Inquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone ?? '—')}</p>
          <p><strong>Group size:</strong> ${groupSize}</p>
          <p><strong>Category:</strong> ${escapeHtml(request.category?.name ?? '—')}</p>
          <p><strong>Preferred dates:</strong> ${escapeHtml(preferredDates ?? '—')}</p>
          <p><strong>Message:</strong> ${escapeHtml(message ?? '—')}</p>
          <p><a href="${escapeHtml(appUrl)}/admin/private-events">View in admin panel</a></p>
        `,
      });
    } catch (err) {
      console.error('Failed to send private event notification email:', err);
    }
  }

  return NextResponse.json({ success: true, id: request.id }, { status: 201 });
}

export async function GET() {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requests = await prisma.privateEventRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json(requests);
}
