import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { hasSmtpConfig, sendMail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const buf = await req.arrayBuffer();
  const body = Buffer.from(buf);
  try {
    const event = stripe.webhooks.constructEvent(body, sig || '', process.env.STRIPE_WEBHOOK_SECRET || '');

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
              <p>Hi ${voucher.purchaserName},</p>
              <p>Thank you for purchasing a gift voucher. Here are the details:</p>
              <p><strong>Voucher Code:</strong> <span style="font-size:1.2em;letter-spacing:0.1em;">${voucher.code}</span></p>
              <p><strong>Value:</strong> ${amountLabel}</p>
              <p><strong>Valid Until:</strong> ${expiryLabel}</p>
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
                <p>${voucher.purchaserName} has sent you a gift voucher for a workshop!</p>
                <p><strong>Voucher Code:</strong> <span style="font-size:1.2em;letter-spacing:0.1em;">${voucher.code}</span></p>
                <p><strong>Value:</strong> ${amountLabel}</p>
                <p><strong>Valid Until:</strong> ${expiryLabel}</p>
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
              <p>Hi ${updated.name},</p>
              <p>Thanks for your payment. Your reservation is confirmed.</p>
              ${sessionDb ? `<p><strong>Workshop:</strong> ${sessionDb.category.name}</p>
              <p><strong>Date:</strong> ${when?.toDateString()}</p>` : ''}
              <p><strong>Participants:</strong> ${updated.quantity}</p>
              <p>We look forward to seeing you!</p>
            `;
            // Don't block the webhook response on mail send
            if (updated.email) sendMail({ to: updated.email, subject, html }).catch((err) => console.error('Email send failed', err)); // email set by customer_details in webhook
          }
        }
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
            <p>Hi ${r.name},</p>
            <p>Your refund has been completed. It may take a few days for it to appear on your statement.</p>
            <p><strong>Participants:</strong> ${r.quantity}</p>
          `;
          sendMail({ to: r.email, subject, html }).catch((e) => console.error('Refund email failed', e));
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }
}
