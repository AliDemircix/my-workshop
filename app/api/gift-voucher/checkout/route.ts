import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { checkRateLimit, getIpFromRequest } from '@/lib/rateLimit';
import { generateVoucherCode } from '@/lib/voucher';

// 5 requests per hour per IP
const VOUCHER_CHECKOUT_LIMIT = 5;
const VOUCHER_CHECKOUT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);
  const rateLimitResult = checkRateLimit(ip, 'gift-voucher-checkout', VOUCHER_CHECKOUT_LIMIT, VOUCHER_CHECKOUT_WINDOW_MS);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfterSeconds),
          'X-RateLimit-Limit': String(VOUCHER_CHECKOUT_LIMIT),
          'X-RateLimit-Window': '3600',
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { giftCardId, purchaserName, purchaserEmail, recipientEmail } = body as Record<string, unknown>;

  if (typeof giftCardId !== 'number' || !Number.isInteger(giftCardId) || giftCardId < 1) {
    return NextResponse.json({ error: 'A valid gift card must be selected' }, { status: 400 });
  }
  if (typeof purchaserName !== 'string' || purchaserName.trim().length === 0) {
    return NextResponse.json({ error: 'Purchaser name is required' }, { status: 400 });
  }
  if (typeof purchaserEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(purchaserEmail)) {
    return NextResponse.json({ error: 'Valid purchaser email is required' }, { status: 400 });
  }
  if (recipientEmail !== undefined && recipientEmail !== null && recipientEmail !== '') {
    if (typeof recipientEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return NextResponse.json({ error: 'Recipient email must be a valid email address' }, { status: 400 });
    }
  }

  const giftCard = await prisma.giftCard.findUnique({
    where: { id: giftCardId },
    include: { category: true },
  });

  if (!giftCard || !giftCard.active) {
    return NextResponse.json({ error: 'The selected gift card is not available' }, { status: 400 });
  }

  const amountCents = giftCard.priceCents;
  const code = generateVoucherCode();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const voucher = await prisma.giftVoucher.create({
    data: {
      code,
      amountCents,
      giftCardId: giftCard.id,
      purchaserName: purchaserName.trim(),
      purchaserEmail: purchaserEmail.trim().toLowerCase(),
      recipientEmail:
        typeof recipientEmail === 'string' && recipientEmail.trim().length > 0
          ? recipientEmail.trim().toLowerCase()
          : null,
      status: 'PENDING',
      expiresAt,
    },
  });

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: voucher.purchaserEmail,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/gift-voucher/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/gift-voucher`,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: `Gift Card — ${giftCard.name}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'gift_voucher',
      giftVoucherId: String(voucher.id),
    },
  });

  await prisma.giftVoucher.update({
    where: { id: voucher.id },
    data: { stripeCheckoutSessionId: checkout.id },
  });

  return NextResponse.json({ url: checkout.url });
}
