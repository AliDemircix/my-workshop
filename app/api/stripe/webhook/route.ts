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
      const reservationId = Number(session.metadata?.reservationId);
      if (reservationId) {
        // Idempotency guard: check previous state
        const existing = await prisma.reservation.findUnique({ where: { id: reservationId } });
        const firstPaid = !(existing && existing.status === 'PAID' && existing.stripePaymentIntentId);

        const updated = await prisma.reservation.update({
          where: { id: reservationId },
          data: { status: 'PAID', stripePaymentIntentId: session.payment_intent as string },
        });

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
          sendMail({ to: updated.email, subject, html }).catch((err) => console.error('Email send failed', err));
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
