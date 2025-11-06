import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function Footer() {
  // Fetch settings or use sensible defaults
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } }).catch(() => null as any);

  const privacyLabel = settings?.privacyLabel ?? 'Privacy Policy';
  const privacyUrl = '/privacy-policy';
  const contactLabel = settings?.contactLabel ?? 'Contact';
  const contactUrl = 'https://www.giftoria.nl/contact-us';
  const refundLabel = settings?.refundLabel ?? 'Refund Policy';
  const refundUrl = '/refund';

  const facebookUrl = settings?.facebookUrl ?? '#';
  const instagramUrl = settings?.instagramUrl ?? '#';
  const youtubeUrl = settings?.youtubeUrl ?? '#';

  const email = settings?.email ?? 'info@example.com';
  const telephone = settings?.telephone ?? '+31 6 12345678';
  const address = settings?.address ?? 'Example street 1, 1000 AA Amsterdam, NL';
  const kvk = settings?.kvk ?? 'KVK 12345678';
  const iban = settings?.iban ?? 'IBAN NL00BANK0123456789';

  return (
    <footer className="mt-12 bg-black text-white">
  <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-sm">
        {/* Column 1: policy pages */}
        <div>
          <h4 className="font-semibold mb-3">Information</h4>
          <ul className="space-y-2">
            <li>
              <Link href={privacyUrl} className="text-gray-300 hover:text-white underline underline-offset-4">
                {privacyLabel}
              </Link>
            </li>
            <li>
              <Link href={contactUrl} className="text-gray-300 hover:text-white underline underline-offset-4">
                {contactLabel}
              </Link>
            </li>
            <li>
              <Link href={refundUrl} className="text-gray-300 hover:text-white underline underline-offset-4">
                {refundLabel}
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: social links */}
        <div>
          <h4 className="font-semibold mb-3">Follow us</h4>
          <div className="flex items-center gap-4">
            <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.01 3.66 9.17 8.44 9.94v-7.03H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.25c-1.23 0-1.61.76-1.61 1.54v1.85h2.74l-.44 2.91h-2.3V22c4.78-.77 8.44-4.93 8.44-9.94Z"/></svg>
            </a>
            <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5Zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7Zm5 3.5A5.5 5.5 0 1111.999 20.5 5.5 5.5 0 0112 7.5Zm0 2a3.5 3.5 0 103.5 3.5A3.5 3.5 0 0012 9.5Zm5.25-3a.75.75 0 11-.75.75.75.75 0 01.75-.75Z"/></svg>
            </a>
            <a href={youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube" className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M21.58 7.2a3 3 0 00-2.11-2.12C17.8 4.5 12 4.5 12 4.5s-5.8 0-7.47.58A3 3 0 002.4 7.2 31.9 31.9 0 001.82 12a31.9 31.9 0 00.58 4.8 3 3 0 002.11 2.12C6.2 19.5 12 19.5 12 19.5s5.8 0 7.47-.58a3 3 0 002.11-2.12A31.9 31.9 0 0022.18 12a31.9 31.9 0 00-.6-4.8ZM10 15.5v-7l6 3.5-6 3.5Z"/></svg>
            </a>
          </div>
        </div>

        {/* Column 3: contact info */}
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-gray-300">
            <li><span className="font-medium">Email:</span> {email}</li>
            <li><span className="font-medium">Telephone:</span> {telephone}</li>
            <li><span className="font-medium">Address:</span> {address}</li>
            <li><span className="font-medium">KVK:</span> {kvk}</li>
            <li><span className="font-medium">IBAN:</span> {iban}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-3 text-center text-xs text-gray-400">© {new Date().getFullYear()} Workshop. All rights reserved.</div>
    </footer>
  );
}
