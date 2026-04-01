"use client";
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface VoucherState {
  code: string;
  status: 'idle' | 'checking' | 'valid' | 'invalid';
  amountCents?: number;
  expiresAt?: string;
  error?: string;
}

export default function ReserveForm({ sessionId, remaining = 0 }: { sessionId: number; remaining?: number }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucher, setVoucher] = useState<VoucherState>({ code: '', status: 'idle' });

  useEffect(() => {
    setQuantity((q) => {
      const max = Math.max(1, remaining);
      const next = Math.min(Math.max(1, q), max);
      return next;
    });
  }, [remaining]);

  const applyVoucher = async () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    setVoucher({ code, status: 'checking' });
    try {
      const res = await fetch(`/api/gift-voucher/validate?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.valid) {
        setVoucher({ code, status: 'valid', amountCents: data.amountCents, expiresAt: data.expiresAt });
      } else {
        setVoucher({ code, status: 'invalid', error: data.error || 'Invalid voucher code' });
      }
    } catch {
      setVoucher({ code, status: 'invalid', error: 'Could not validate voucher. Please try again.' });
    }
  };

  const clearVoucher = () => {
    setVoucher({ code: '', status: 'idle' });
    setVoucherInput('');
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, name, email, quantity }),
      });
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error('Not enough spots left for this timeslot.');
        }
        throw new Error('Failed to create reservation');
      }
      const reservation = await res.json();

      const appliedCode = voucher.status === 'valid' ? voucher.code : undefined;

      const checkout = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: reservation.id, ...(appliedCode ? { voucherCode: appliedCode } : {}) }),
      });
      const data = await checkout.json();

      if (data.free) {
        // Voucher covered the full price
        window.location.href = `${window.location.origin}/reserve/success`;
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error creating reservation');
    } finally {
      setLoading(false);
    }
  };

  const voucherIsValid = voucher.status === 'valid';
  const buttonLabel = loading
    ? 'Processing…'
    : voucherIsValid && voucher.amountCents !== undefined
    ? `Reserve & Pay (voucher applied)`
    : 'Reserve & Pay';

  return (
    <div className="space-y-3 border rounded p-4">
      <h3 className="font-medium">Your details</h3>
      <div className="grid grid-cols-1 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="reserve-name" className="text-sm font-medium text-gray-700">Full name</label>
          <input id="reserve-name" className="border rounded px-3 py-2 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="reserve-email" className="text-sm font-medium text-gray-700">Email address</label>
          <input id="reserve-email" type="email" className="border rounded px-3 py-2 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div>
        <label htmlFor="reserve-quantity" className="text-sm font-medium text-gray-700 block mb-1">Number of participants</label>
        <input
          id="reserve-quantity"
          type="number"
          className="border rounded px-3 py-2 w-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
          value={quantity}
          min={1}
          max={Math.max(1, remaining)}
          disabled={remaining <= 0}
          onChange={(e) => {
            const v = Number(e.target.value);
            const max = Math.max(1, remaining);
            const clamped = Number.isFinite(v) ? Math.min(Math.max(1, v), max) : 1;
            setQuantity(clamped);
          }}
        />
        {remaining > 0 ? (
          <p className="text-xs text-gray-500 mt-1">Max {remaining} {remaining === 1 ? 'spot' : 'spots'} left</p>
        ) : (
          <p className="text-xs text-red-600 mt-1">Sold out</p>
        )}
      </div>

      {/* Gift voucher toggle */}
      <div className="border-t pt-3">
        <button
          type="button"
          className="text-sm text-[#c99706] hover:underline focus:outline-none flex items-center gap-1"
          onClick={() => setVoucherOpen((o) => !o)}
        >
          <svg
            className={`w-4 h-4 transition-transform ${voucherOpen ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Have a gift voucher?
        </button>

        {voucherOpen && (
          <div className="mt-2 space-y-2">
            {voucher.status !== 'valid' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="border rounded px-3 py-2 flex-1 uppercase tracking-widest text-sm font-mono"
                  placeholder="GIFT-XXXX-XXXX"
                  value={voucherInput}
                  onChange={(e) => {
                    setVoucherInput(e.target.value.toUpperCase());
                    if (voucher.status !== 'idle') setVoucher({ code: '', status: 'idle' });
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyVoucher(); }}
                />
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-[#c99706] text-white text-sm hover:bg-[#b3860a] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={applyVoucher}
                  disabled={voucher.status === 'checking' || voucherInput.trim().length === 0}
                >
                  {voucher.status === 'checking' ? 'Checking…' : 'Apply'}
                </button>
              </div>
            ) : null}

            {voucher.status === 'valid' && voucher.amountCents !== undefined && (
              <div className="flex items-center justify-between rounded bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
                <span>
                  Voucher <strong>{voucher.code}</strong> — €{(voucher.amountCents / 100).toFixed(2)} applied
                </span>
                <button
                  type="button"
                  className="ml-3 text-green-600 hover:text-green-800 underline text-xs"
                  onClick={clearVoucher}
                >
                  Remove
                </button>
              </div>
            )}

            {voucher.status === 'invalid' && (
              <p className="text-sm text-red-600">{voucher.error}</p>
            )}
          </div>
        )}
      </div>

      <button
        className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading || remaining <= 0}
        onClick={submit}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
