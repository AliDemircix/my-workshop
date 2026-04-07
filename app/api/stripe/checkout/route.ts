import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { checkRateLimit, getIpFromRequest } from '@/lib/rateLimit';

// 10 requests per hour per IP
const CHECKOUT_LIMIT = 10;
const CHECKOUT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
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

  const { reservationId, voucherCode, promoCode } = await req.json();
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { session: { include: { category: true } } },
  });
  if (!reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  if (reservation.status !== 'PENDING') {
    return NextResponse.json({ error: 'Reservation is not in a payable state' }, { status: 409 });
  }
  if (reservation.expiresAt && new Date(reservation.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Reservation has expired. Please start a new booking.' }, { status: 410 });
  }

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
      payment_method_types: ['card'],
      billing_address_collection: 'required',
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

  // ── Promo code path ────────────────────────────────────────────────────────
  let stripeCouponId: string | undefined;
  let promoRecord: { id: number; code: string; type: string; value: number; usedCount: number; maxUses: number | null } | null = null;

  if (typeof promoCode === 'string' && promoCode.trim().length > 0) {
    const normalizedPromo = promoCode.trim().toUpperCase();
    promoRecord = await prisma.promoCode.findUnique({ where: { code: normalizedPromo } });

    if (!promoRecord) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
    }

    const now = new Date();
    if ((promoRecord as any).validFrom && new Date((promoRecord as any).validFrom) > now) {
      return NextResponse.json({ error: 'Promo code is not yet valid' }, { status: 400 });
    }
    if ((promoRecord as any).validUntil && new Date((promoRecord as any).validUntil) < now) {
      return NextResponse.json({ error: 'Promo code has expired' }, { status: 400 });
    }
    if (promoRecord.maxUses !== null && promoRecord.usedCount >= promoRecord.maxUses) {
      return NextResponse.json({ error: 'Promo code usage limit reached' }, { status: 400 });
    }

    // Create a Stripe coupon on-the-fly (once per checkout)
    const coupon = await stripe.coupons.create(
      promoRecord.type === 'PERCENTAGE'
        ? { percent_off: promoRecord.value, duration: 'once' }
        : { amount_off: Math.round(promoRecord.value * 100), currency: 'eur', duration: 'once' },
    );
    stripeCouponId = coupon.id;
  }

  // ── Standard path (no voucher) ─────────────────────────────────────────────
  const unitAmount = session.priceCents;

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card', 'ideal'],
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
    ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
    metadata: {
      reservationId: String(reservation.id),
      ...(promoRecord ? { promoCode: promoRecord.code } : {}),
    },
  });

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { stripeCheckoutSessionId: checkout.id },
  });

  // Increment promo usedCount after successful checkout session creation
  if (promoRecord) {
    await prisma.promoCode.update({
      where: { id: promoRecord.id },
      data: { usedCount: { increment: 1 } },
    });
  }

  return NextResponse.json({ url: checkout.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Checkout failed. Please try again.' }, { status: 500 });
  }
}
