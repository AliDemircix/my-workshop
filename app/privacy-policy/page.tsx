import { prisma } from '@/lib/prisma';
import { sanitizeHtml } from '@/lib/sanitize';

export default async function PrivacyPolicyPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } }).catch(() => null as any);
  const content = settings?.privacyContent;
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Privacy Policy</h1>
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
      ) : (
        <>
          <p>Last updated: September 18, 2025</p>
          <p>
            We value your privacy. This policy explains what data we collect, how we use it, and your rights.
          </p>
          <h2>Information We Collect</h2>
          <ul>
            <li>Account and contact information (name, email, phone).</li>
            <li>Reservation details (selected workshop, date, participants).</li>
            <li>Payment information processed by our payment provider (we do not store card details).</li>
            <li>Technical data (IP address, device info) for security and analytics.</li>
          </ul>
          <h2>How We Use Information</h2>
          <ul>
            <li>To provide and manage your reservations.</li>
            <li>To process payments and handle refunds.</li>
            <li>To communicate updates and respond to inquiries.</li>
            <li>To maintain security and improve our services.</li>
          </ul>
          <h2>Sharing</h2>
          <p>We share data with service providers (e.g., payments, hosting) under strict agreements. We do not sell personal data.</p>
          <h2>Data Retention</h2>
          <p>We retain data as long as necessary for legal, accounting, or business purposes.</p>
          <h2>Your Rights</h2>
          <ul>
            <li>Access, correct, or delete your data.</li>
            <li>Object to processing or request restriction.</li>
            <li>Data portability where applicable.</li>
          </ul>
          <h2>Contact</h2>
          <p>For privacy requests, please contact us via the Contact page.</p>
        </>
      )}
    </div>
  );
}
