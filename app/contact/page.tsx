import { prisma } from '@/lib/prisma';

export default function ContactPage() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Contact Us</h1>
      <ContactDetails />
      <h2>Business Hours</h2>
      <p>
        We typically respond within 1-2 business days. If your inquiry is urgent, please include “Urgent” in the subject.
      </p>
      <h2>Location</h2>
      <p>Workshops are held at our studio unless otherwise noted in your booking confirmation.</p>
    </div>
  );
}

async function ContactDetails() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return (
    <ul>
      <li><strong>Email:</strong> {settings?.email ?? 'info@example.com'}</li>
      <li><strong>Telephone:</strong> {settings?.telephone ?? '+31 6 12345678'}</li>
      <li><strong>Address:</strong> {settings?.address ?? 'Example street 1, 1000 AA Amsterdam, NL'}</li>
      <li><strong>KVK:</strong> {settings?.kvk ?? 'KVK 12345678'}</li>
      <li><strong>IBAN:</strong> {settings?.iban ?? 'IBAN NL00BANK0123456789'}</li>
    </ul>
  );
}
