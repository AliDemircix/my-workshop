import { prisma } from '@/lib/prisma';
import { sendReminderEmail } from '@/lib/mailer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      await sendReminderEmail({
        to: reservation.email,
        customerName: reservation.name,
        categoryName: reservation.session.category.name,
        sessionDate: new Date(reservation.session.date),
        startTime: new Date(reservation.session.startTime),
        endTime: new Date(reservation.session.endTime),
        quantity: reservation.quantity,
        location: siteSettings?.address ?? null,
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
