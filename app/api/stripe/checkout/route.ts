import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { checkRateLimit, getIpFromRequest } from '@/lib/rateLimit';

// 10 requests per hour per IP
const CHECKOUT_LIMIT = 10;
const CHECKOUT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);
  const rateLimitResult = checkRateLimit(ip, 'checkout', CHECKOUT_LIMIT, CHECKOUT_WINDOW_MS);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfterSeconds),
          'X-RateLimit-Limit': String(CHECKOUT_LIMIT),
          'X-RateLimit-Window': '3600',
        },
      },
    );
  }

  const { reservationId, voucherCode } = await req.json();
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { session: { include: { category: true } } },
  });
  if (!reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });

  const session = reservation.session;
  const totalPrice = session.priceCents * reservation.quantity;

  // ── Voucher redemption path ────────────────────────────────────────────────
  if (typeof voucherCode === 'string' && voucherCode.trim().length > 0) {
    const normalizedCode = voucherCode.trim().toUpperCase();
    const voucher = await prisma.giftVoucher.findUnique({ where: { code: normalizedCode } });

    if (!voucher || voucher.status !== 'PAID' || new Date(voucher.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired voucher code' }, { status: 400 });
    }

    const discountCents = Math.min(voucher.amountCents, totalPrice);
    const remainingCents = totalPrice - discountCents;

    if (remainingCents === 0) {
      // Voucher covers the full price — no Stripe session needed
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: 'PAID' },
      });
      await prisma.giftVoucher.update({
        where: { id: voucher.id },
        data: { status: 'USED', redeemedByReservationId: reservation.id },
      });
      return NextResponse.json({ success: true, free: true });
    }

    // Voucher partially covers — charge the remainder via Stripe
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/reserve/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/reserve/cancel`,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${session.category.name} ${new Date(session.date).toDateString()}`,
              description: `Gift voucher applied: -€${(discountCents / 100).toFixed(2)}`,
            },
            unit_amount: remainingCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        reservationId: String(reservation.id),
        voucherCode: normalizedCode,
      },
    });

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { stripeCheckoutSessionId: checkout.id },
    });

    return NextResponse.json({ url: checkout.url });
  }

  // ── Standard path (no voucher) ─────────────────────────────────────────────
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
