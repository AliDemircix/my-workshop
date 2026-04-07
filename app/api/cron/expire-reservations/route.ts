import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const toExpire = await prisma.reservation.findMany({
    where: { status: 'PENDING', expiresAt: { lt: now } },
    select: { id: true, stripeCheckoutSessionId: true },
  });

  const { count } = await prisma.reservation.updateMany({
    where: { status: 'PENDING', expiresAt: { lt: now } },
    data: { status: 'CANCELED', canceledAt: now },
  });

  for (const reservation of toExpire) {
    if (reservation.stripeCheckoutSessionId) {
      try {
        await stripe.checkout.sessions.expire(reservation.stripeCheckoutSessionId);
      } catch {
        // best-effort — session may already be expired or completed
      }
    }
  }

  return NextResponse.json({ canceled: count });
}
