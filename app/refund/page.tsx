import { prisma } from '@/lib/prisma';
import { sanitizeHtml } from '@/lib/sanitize';

export default async function RefundPolicyPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } }).catch(() => null as any);
  const content = settings?.refundContent;
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Refund Policy</h1>
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
      ) : (
        <>
          <p>Last updated: September 18, 2025</p>
          <h2>Cancellations by Customers</h2>
          <p>
            You can cancel a reservation up to 48 hours before the workshop for a full refund. For late cancellations, please
            contact us. Refund eligibility may vary based on the workshop type.
          </p>
          <h2>Cancellations by Us</h2>
          <p>
            If we cancel a workshop due to unforeseen circumstances, you will be offered a full refund or the option to reschedule.
          </p>
          <h2>How Refunds Are Processed</h2>
          <p>
            Refunds are issued to the original payment method through our payment provider. Processing times may vary by bank.
          </p>
        </>
      )}
    </div>
  );
}
