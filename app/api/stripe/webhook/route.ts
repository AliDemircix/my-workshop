import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { hasSmtpConfig, sendMail } from '@/lib/mailer';
import { generateICS } from '@/lib/ics';
import {
  resolveLocale,
  buildReservationConfirmationEmail,
  buildGiftVoucherPurchaserEmail,
  buildGiftVoucherRecipientEmail,
  buildRefundNotificationEmail,
} from '@/lib/email-templates';

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
      const locale = resolveLocale(session.metadata?.locale);

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
            const purchaserTpl = buildGiftVoucherPurchaserEmail({
              purchaserName: voucher.purchaserName,
              voucherCode: voucher.code,
              amountLabel,
              expiryLabel,
              locale,
            });
            sendMail({
              to: voucher.purchaserEmail,
              subject: purchaserTpl.subject,
              html: purchaserTpl.html,
              text: purchaserTpl.text,
            }).catch((err) => console.error('Gift voucher purchaser email failed', err));

            // Gift email to recipient if set
            if (voucher.recipientEmail) {
              const recipientTpl = buildGiftVoucherRecipientEmail({
                senderName: voucher.purchaserName,
                voucherCode: voucher.code,
                amountLabel,
                expiryLabel,
                locale,
              });
              sendMail({
                to: voucher.recipientEmail,
                subject: recipientTpl.subject,
                html: recipientTpl.html,
                text: recipientTpl.text,
              }).catch((err) => console.error('Gift voucher recipient email failed', err));
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
            const siteSettings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

            const tpl = buildReservationConfirmationEmail({
              customerName: updated.name,
              categoryName: sessionDb?.category.name ?? '',
              sessionDate: sessionDb ? new Date(sessionDb.date) : null,
              quantity: updated.quantity,
              locale,
            });

            const attachments = sessionDb
              ? [
                  {
                    filename: 'invite.ics',
                    content: generateICS({
                      reservationId: updated.id,
                      categoryName: sessionDb.category.name,
                      date: new Date(sessionDb.date),
                      startTime: new Date(sessionDb.startTime),
                      endTime: new Date(sessionDb.endTime),
                      location: siteSettings?.address ?? null,
                    }),
                    contentType: 'text/calendar',
                  },
                ]
              : undefined;

            // Don't block the webhook response on mail send
            if (updated.email) {
              sendMail({
                to: updated.email,
                subject: tpl.subject,
                html: tpl.html,
                text: tpl.text,
                attachments,
              }).catch((err) => console.error('Email send failed', err));
            }
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
          // Refund emails don't have a locale stored on the reservation — use default.
          const tpl = buildRefundNotificationEmail({
            customerName: r.name,
            quantity: r.quantity,
          });
          sendMail({ to: r.email, subject: tpl.subject, html: tpl.html, text: tpl.text }).catch((e) =>
            console.error('Refund email failed', e),
          );
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
