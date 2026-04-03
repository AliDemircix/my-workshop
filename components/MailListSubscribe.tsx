"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function MailListSubscribe() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/mail-list/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? 'Subscription failed');
      }
      toast.success('You have been subscribed!');
      setEmail('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-gray-50 -mx-4 px-4 py-16">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Stay in the Loop</h2>
          <p className="text-gray-600">
            Subscribe to our mailing list and be the first to hear about new workshops, special offers, and events.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#c99706] focus:outline-none focus:ring-1 focus:ring-[#c99706]"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#c99706] hover:bg-[#b8860b] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-all duration-300 whitespace-nowrap"
          >
            {loading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  );
}
