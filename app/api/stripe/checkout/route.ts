import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const { reservationId } = await req.json();
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { session: { include: { category: true } } },
  });
  if (!reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });

  const session = reservation.session;
  const unitAmount = session.priceCents;

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/reserve/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/reserve/cancel`,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: `${session.category.name} ${new Date(session.date).toDateString()}` },
          unit_amount: unitAmount,
        },
        quantity: reservation.quantity,
      },
    ],
    metadata: { reservationId: String(reservation.id) },
  });

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { stripeCheckoutSessionId: checkout.id },
  });

  return NextResponse.json({ url: checkout.url });
}
