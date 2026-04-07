import { prisma } from '@/lib/prisma';
import { hasSmtpConfig, sendMail } from '@/lib/mailer';
import { buildReservationReminderEmail } from '@/lib/email-templates';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasSmtpConfig()) {
    return NextResponse.json({ sent: 0, skipped: 'no_smtp' });
  }

  const now = new Date();

  // Build start-of-tomorrow and end-of-tomorrow in UTC
  const tomorrowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  const tomorrowEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 23, 59, 59, 999));

  const reservations = await prisma.reservation.findMany({
    where: {
      status: 'PAID',
      reminderSentAt: null,
      session: {
        date: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
      },
    },
    include: {
      session: {
        include: { category: true },
      },
    },
  });

  const siteSettings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  let sent = 0;
  for (const reservation of reservations) {
    try {
      if (!reservation.email) continue;

      // Reminder emails don't carry a stored locale — use the default.
      // If locale is added to the Reservation model in a future feature,
      // read it here with resolveLocale(reservation.locale).
      const tpl = buildReservationReminderEmail({
        customerName: reservation.name,
        categoryName: reservation.session.category.name,
        sessionDate: new Date(reservation.session.date),
        startTime: new Date(reservation.session.startTime),
        endTime: new Date(reservation.session.endTime),
        quantity: reservation.quantity,
        location: siteSettings?.address ?? null,
      });

      await sendMail({
        to: reservation.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { reminderSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send reminder for reservation ${reservation.id}:`, err);
    }
  }

  return NextResponse.json({ sent });
}
