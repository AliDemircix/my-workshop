import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { hasSmtpConfig, sendMail } from '@/lib/mailer';

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const buf = await req.arrayBuffer();
  const body = Buffer.from(buf);

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(body, sig || '', process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Upsert a WebhookEvent record for this Stripe event (idempotency + audit trail).
  // We create it as PROCESSED optimistically; on failure we update to FAILED.
  const webhookRecord = await prisma.webhookEvent.upsert({
    where: { stripeEventId: event.id },
    create: {
      stripeEventId: event.id,
      type: event.type,
      status: 'PROCESSED',
      payload: JSON.stringify(event),
      processedAt: new Date(),
    },
    update: {},
  });

  // If a record already existed (i.e. update ran, not create), the event was
  // already processed — return early to honour idempotency.
  if (webhookRecord.status === 'PROCESSED' && webhookRecord.processedAt !== null) {
    const createdJustNow = Date.now() - webhookRecord.createdAt.getTime() < 5000;
    if (!createdJustNow) {
      return NextResponse.json({ received: true, skipped: true });
    }
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;

      // ── Gift voucher purchase ────────────────────────────────────────────────
      if (session.metadata?.type === 'gift_voucher') {
        const giftVoucherId = Number(session.metadata?.giftVoucherId);
        if (giftVoucherId) {
          const existing = await prisma.giftVoucher.findUnique({ where: { id: giftVoucherId } });
          const firstPaid = !(existing && existing.status === 'PAID' && existing.stripePaymentIntentId);

          const voucher = await prisma.giftVoucher.update({
            where: { id: giftVoucherId },
            data: {
              status: 'PAID',
              stripePaymentIntentId: session.payment_intent as string,
            },
          });

          if (firstPaid && hasSmtpConfig()) {
            const amountLabel = `€${(voucher.amountCents / 100).toFixed(2)}`;
            const expiryLabel = new Date(voucher.expiresAt).toDateString();

            // Confirmation to purchaser
            const purchaserSubject = 'Your gift voucher is ready!';
            const purchaserHtml = `
              <p>Hi ${escapeHtml(voucher.purchaserName)},</p>
              <p>Thank you for purchasing a gift voucher. Here are the details:</p>
              <p><strong>Voucher Code:</strong> <span style="font-size:1.2em;letter-spacing:0.1em;">${escapeHtml(voucher.code)}</span></p>
              <p><strong>Value:</strong> ${escapeHtml(amountLabel)}</p>
              <p><strong>Valid Until:</strong> ${escapeHtml(expiryLabel)}</p>
              <p>This voucher can be applied at checkout when booking a workshop.</p>
              <p>Enjoy!</p>
            `;
            sendMail({ to: voucher.purchaserEmail, subject: purchaserSubject, html: purchaserHtml }).catch((err) =>
              console.error('Gift voucher purchaser email failed', err),
            );

            // Gift email to recipient if set
            if (voucher.recipientEmail) {
              const recipientSubject = `You've received a gift voucher!`;
              const recipientHtml = `
                <p>Hi there,</p>
                <p>${escapeHtml(voucher.purchaserName)} has sent you a gift voucher for a workshop!</p>
                <p><strong>Voucher Code:</strong> <span style="font-size:1.2em;letter-spacing:0.1em;">${escapeHtml(voucher.code)}</span></p>
                <p><strong>Value:</strong> ${escapeHtml(amountLabel)}</p>
                <p><strong>Valid Until:</strong> ${escapeHtml(expiryLabel)}</p>
                <p>Use this code at checkout when booking your workshop.</p>
                <p>Enjoy!</p>
              `;
              sendMail({ to: voucher.recipientEmail, subject: recipientSubject, html: recipientHtml }).catch((err) =>
                console.error('Gift voucher recipient email failed', err),
              );
            }
          }
        }
      } else {
        // ── Workshop reservation payment ───────────────────────────────────────
        const reservationId = Number(session.metadata?.reservationId);
        if (reservationId) {
          // Idempotency guard: check previous state
          const existing = await prisma.reservation.findUnique({ where: { id: reservationId } });
          const firstPaid = !(existing && existing.status === 'PAID' && existing.stripePaymentIntentId);

          if (existing?.status === 'CANCELED') {
            // Cron already expired this reservation — refund the payment
            if (session.payment_intent) {
              await stripe.refunds.create({ payment_intent: session.payment_intent as string });
            }
            return NextResponse.json({ received: true });
          }

          const customerName = session.customer_details?.name as string | undefined;
          const customerEmail = session.customer_details?.email as string | undefined;

          const updated = await prisma.reservation.update({
            where: { id: reservationId },
            data: {
              status: 'PAID',
              stripePaymentIntentId: session.payment_intent as string,
              ...(customerName ? { name: customerName } : {}),
              ...(customerEmail ? { email: customerEmail } : {}),
            },
          });

          // Mark voucher as USED if one was applied as partial payment
          const voucherCode = session.metadata?.voucherCode as string | undefined;
          if (voucherCode) {
            await prisma.giftVoucher.updateMany({
              where: { code: voucherCode, status: 'PAID' },
              data: { status: 'USED', redeemedByReservationId: reservationId },
            });
          }

          // Fire-and-forget email confirmation (best-effort) only once
          if (firstPaid && hasSmtpConfig()) {
            const sessionDb = await prisma.session.findUnique({
              where: { id: updated.sessionId },
              include: { category: true },
            });
            const when = sessionDb ? new Date(sessionDb.date) : null;
            const subject = `Your reservation is confirmed`;
            const html = `
              <p>Hi ${escapeHtml(updated.name)},</p>
              <p>Thanks for your payment. Your reservation is confirmed.</p>
              ${sessionDb ? `<p><strong>Workshop:</strong> ${escapeHtml(sessionDb.category.name)}</p>
              <p><strong>Date:</strong> ${escapeHtml(when?.toDateString())}</p>` : ''}
              <p><strong>Participants:</strong> ${updated.quantity}</p>
              <p>We look forward to seeing you!</p>
            `;
            // Don't block the webhook response on mail send
            if (updated.email) sendMail({ to: updated.email, subject, html }).catch((err) => console.error('Email send failed', err)); // email set by customer_details in webhook
          }
        }
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as any;
      const reservationId = session.metadata?.reservationId;
      if (reservationId) {
        await prisma.reservation.updateMany({
          where: { id: Number(reservationId), status: 'PENDING' },
          data: { status: 'CANCELED', canceledAt: new Date() },
        });
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as any;
      const paymentIntent = charge.payment_intent as string;
      const reservations = await prisma.reservation.findMany({ where: { stripePaymentIntentId: paymentIntent } });
      await prisma.reservation.updateMany({
        where: { stripePaymentIntentId: paymentIntent },
        data: { status: 'REFUNDED', refundId: charge.refunds?.data?.[0]?.id },
      });
      // Notify users that refund is completed
      if (hasSmtpConfig()) {
        for (const r of reservations) {
          if (!r.email) continue;
          const subject = 'Your refund has been completed';
          const html = `
            <p>Hi ${escapeHtml(r.name)},</p>
            <p>Your refund has been completed. It may take a few days for it to appear on your statement.</p>
            <p><strong>Participants:</strong> ${r.quantity}</p>
          `;
          sendMail({ to: r.email, subject, html }).catch((e) => console.error('Refund email failed', e));
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    // Mark the webhook event as failed so admins can identify stuck events.
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        status: 'FAILED',
        errorMessage: String(err?.message ?? err),
        processedAt: null,
      },
    });
    console.error(`Webhook processing failed for event ${event.id}:`, err);
    // Return 500 so Stripe will retry the event.
    return new NextResponse(`Webhook processing error: ${err.message}`, { status: 500 });
  }
}
