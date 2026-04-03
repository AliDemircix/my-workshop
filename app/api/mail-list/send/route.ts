import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { sanitizeHtml } from '@/lib/sanitize';
import { sendMail, hasSmtpConfig } from '@/lib/mailer';
import { logger } from '@/lib/logger';

const SendSchema = z.object({
  subject: z.string().min(1),
  html: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await req.json();
  const parsed = SendSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { subject, html } = parsed.data;
  const safeHtml = sanitizeHtml(html);

  const subscribers = await prisma.mailSubscriber.findMany({
    select: { email: true },
  });

  if (subscribers.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  if (!hasSmtpConfig()) {
    logger.smtpWarning('Newsletter send skipped — SMTP not configured');
    return NextResponse.json({ sent: 0, warning: 'SMTP not configured' });
  }

  let sent = 0;
  for (const subscriber of subscribers) {
    try {
      await sendMail({ to: subscriber.email, subject, html: safeHtml });
      sent++;
    } catch (error) {
      logger.emailError('newsletter send', error as Error, { to: subscriber.email, subject });
    }
  }

  logger.info('Newsletter send complete', { subject, sent, total: subscribers.length });

  return NextResponse.json({ sent });
}
