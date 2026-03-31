"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatEUR } from '@/lib/currency';

type GiftCardItem = {
  id: number;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  category: { name: string } | null;
};

type DeliveryMode = 'email' | 'self';

export default function GiftCardShop({ giftCards }: { giftCards: GiftCardItem[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  const [selectedCard, setSelectedCard] = useState<GiftCardItem | null>(null);
  const [delivery, setDelivery] = useState<DeliveryMode>('email');
  const [purchaserName, setPurchaserName] = useState('');
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelectCard(card: GiftCardItem) {
    setSelectedCard(card);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCard) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/gift-voucher/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftCardId: selectedCard.id,
          purchaserName: purchaserName.trim(),
          purchaserEmail: purchaserEmail.trim(),
          recipientEmail: delivery === 'email' && recipientEmail.trim() ? recipientEmail.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      if (data.url) {
        router.push(data.url);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      {/* LEFT — gift card grid */}
      <div className="lg:col-span-3 space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gift Cards</h1>
          <p className="mt-1 text-gray-500">Choose a gift card below — the price is fixed and ready to give.</p>
        </div>

        {giftCards.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center text-gray-500">
            No gift cards available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {giftCards.map((card) => (
              <div
                key={card.id}
                className={`relative rounded-2xl overflow-hidden shadow-sm border bg-white group transition-all ${
                  selectedCard?.id === card.id
                    ? 'border-[#c99706] ring-2 ring-[#c99706]/30'
                    : 'border-gray-100'
                }`}
              >
                {/* Image */}
                <div className="relative aspect-video w-full overflow-hidden">
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-yellow-200" />
                  )}
                  <div className="absolute top-2 right-2 bg-[#c99706] text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
                    {formatEUR(card.priceCents)}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <p className="font-bold text-gray-900">{card.name}</p>
                  {card.category && (
                    <p className="text-xs text-gray-400 mt-0.5">{card.category.name}</p>
                  )}
                  {card.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{card.description}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectCard(card)}
                    className="mt-3 w-full bg-[#c99706] hover:bg-[#b8860b] text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
                  >
                    {selectedCard?.id === card.id ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — form + info cards */}
      <div className="lg:col-span-2 space-y-4" ref={formRef}>

        {/* Purchase form */}
        <div className="bg-white rounded-2xl shadow p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#c99706]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Send a Gift Card</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Selected card chip */}
            {selectedCard ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-3 py-1 rounded-full">
                  <span>🎁</span>
                  <span>{selectedCard.name}</span>
                  <span className="text-amber-600 font-semibold">— {formatEUR(selectedCard.priceCents)}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCard(null)}
                    className="ml-1 text-amber-500 hover:text-amber-700 leading-none"
                    aria-label="Remove selection"
                  >
                    ×
                  </button>
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Select a gift card from the left to continue.</p>
            )}

            {/* Delivery toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(['email', 'self'] as DeliveryMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDelivery(mode)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      delivery === mode
                        ? 'bg-[#c99706] text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {mode === 'email' ? 'Send by email' : "I'll deliver it myself"}
                  </button>
                ))}
              </div>
            </div>

            {/* Sender fields */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-gray-700">Your details</legend>
              <input
                type="text"
                required
                placeholder="Your name"
                value={purchaserName}
                onChange={(e) => setPurchaserName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c99706]/40 focus:border-[#c99706]"
              />
              <input
                type="email"
                required
                placeholder="Your email"
                value={purchaserEmail}
                onChange={(e) => setPurchaserEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c99706]/40 focus:border-[#c99706]"
              />
            </fieldset>

            {/* Recipient fields — only when sending by email */}
            {delivery === 'email' && (
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-gray-700">Recipient details</legend>
                <input
                  type="text"
                  placeholder="Recipient name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c99706]/40 focus:border-[#c99706]"
                />
                <input
                  type="email"
                  required
                  placeholder="Recipient email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c99706]/40 focus:border-[#c99706]"
                />
                <textarea
                  placeholder="Personal message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c99706]/40 focus:border-[#c99706] resize-none"
                />
              </fieldset>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !selectedCard}
              className="w-full bg-[#c99706] hover:bg-[#b8860b] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading
                ? 'Redirecting to payment…'
                : selectedCard
                ? `Pay ${formatEUR(selectedCard.priceCents)} — Secure Checkout`
                : 'Select a gift card first'}
            </button>
          </form>
        </div>

        {/* How it works */}
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6">
          <h3 className="font-bold text-gray-900 mb-1">How it works</h3>
          <p className="text-sm text-gray-500 mb-4">Three simple steps and the surprise is sorted.</p>
          <ol className="space-y-4">
            {[
              {
                n: '1',
                title: 'Digital delivery',
                desc: "You'll receive the gift voucher by email with a unique code.",
              },
              {
                n: '2',
                title: 'Spend it however you like',
                desc: 'The recipient chooses a date or workshop on our website.',
              },
              {
                n: '3',
                title: 'Redeem',
                desc: 'At checkout, the recipient enters the code to receive a discount.',
              },
            ].map((step) => (
              <li key={step.n} className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-[#c99706] text-white text-xs font-bold flex items-center justify-center">
                  {step.n}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* A personal touch */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-2">
          <p className="font-semibold text-gray-900">A personal touch</p>
          <p className="text-sm text-gray-600">
            Add a lovely message or schedule delivery for the perfect moment.
          </p>
          <p className="text-sm text-gray-600">
            Along with the digital voucher, we&apos;ll also send you a print-friendly design. Handy if you want to hand over the surprise in person.
          </p>
          <p className="text-sm text-gray-600">
            Do you have any special requests? Let us know via the contact form or WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
