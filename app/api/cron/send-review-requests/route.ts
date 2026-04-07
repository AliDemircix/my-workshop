import { prisma } from '@/lib/prisma';
import { sendReviewRequestEmail } from '@/lib/mailer';
import { generateReviewToken } from '@/lib/reviewToken';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron job: send review request emails to customers whose session ended >= 2 days ago
 * and who have not yet received a review request.
 *
 * Should be triggered daily, e.g. via Vercel Cron or an external scheduler.
 * Requires Authorization: Bearer <CRON_SECRET> header.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Sessions that ended 2+ days ago (endTime <= now - 2 days)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const reservations = await prisma.reservation.findMany({
    where: {
      status: 'PAID',
      reviewRequestSentAt: null,
      email: { not: '' },
      session: {
        endTime: { lte: twoDaysAgo },
      },
    },
    include: {
      session: {
        include: { category: { select: { name: true } } },
      },
    },
  });

  let sent = 0;
  for (const reservation of reservations) {
    try {
      if (!reservation.email) continue;

      const token = generateReviewToken(reservation.id);

      await sendReviewRequestEmail({
        to: reservation.email,
        customerName: reservation.name || 'there',
        categoryName: reservation.session.category.name,
        sessionDate: new Date(reservation.session.date),
        reviewToken: token,
      });

      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { reviewRequestSentAt: now },
      });

      sent++;
    } catch (err) {
      console.error(`Failed to send review request for reservation ${reservation.id}:`, err);
    }
  }

  return NextResponse.json({ sent });
}
