import FAQ from '@/components/FAQ';
import Link from 'next/link';

export const metadata = {
  title: 'FAQ - Frequently Asked Questions | Workshop Reservations',
  description: 'Get answers to common questions about our epoxy resin workshops, booking process, and policies.',
};

export default function FAQPage() {
  return (
    <main className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500">
        <Link href="/" className="hover:text-[#c99706] transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">FAQ</span>
      </nav>

      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Find answers to the most common questions about our workshops, booking process, and policies.
        </p>
      </div>

      <div className="h-px bg-gray-200" />
      
      <FAQ />

      {/* Additional Help Section */}
      <div className="bg-gradient-to-r from-[#c99706] to-[#b8860b] -mx-4 px-4 py-12 text-white text-center mt-16">
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">Still Need Help?</h2>
          <p className="text-lg opacity-90">
            Can't find the answer you're looking for? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://giftoria.nl/contact-us"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-[#c99706] hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-all duration-300"
            >
              Contact Us
            </a>
            <Link 
              href="/reserve"
              className="border-2 border-white text-white hover:bg-white hover:text-[#c99706] font-semibold px-6 py-3 rounded-lg transition-all duration-300"
            >
              Book a Workshop
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}