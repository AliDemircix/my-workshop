"use client";
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';

interface VoucherState {
  code: string;
  status: 'idle' | 'checking' | 'valid' | 'invalid';
  amountCents?: number;
  expiresAt?: string;
  error?: string;
}

interface PromoState {
  code: string;
  status: 'idle' | 'checking' | 'valid' | 'invalid';
  discountCents?: number;
  finalAmountCents?: number;
  type?: string;
  value?: number;
  error?: string;
}

export default function ReserveForm({
  sessionId,
  remaining = 0,
  priceCents = 0,
  categoryId,
}: {
  sessionId: number;
  remaining?: number;
  priceCents?: number;
  categoryId?: number;
}) {
  const t = useTranslations('reserve');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucher, setVoucher] = useState<VoucherState>({ code: '', status: 'idle' });

  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoState>({ code: '', status: 'idle' });

  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, remaining)));
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

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromo({ code, status: 'checking' });
    try {
      const totalAmountCents = priceCents * quantity;
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, totalAmountCents, ...(categoryId ? { categoryId } : {}) }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setPromo({
          code,
          status: 'valid',
          discountCents: data.discountCents,
          finalAmountCents: data.finalAmountCents,
          type: data.type,
          value: data.value,
        });
      } else {
        setPromo({ code, status: 'invalid', error: typeof data.error === 'string' ? data.error : 'Invalid promo code' });
      }
    } catch {
      setPromo({ code, status: 'invalid', error: 'Could not validate promo code. Please try again.' });
    }
  };

  const clearPromo = () => {
    setPromo({ code: '', status: 'idle' });
    setPromoInput('');
  };

  const submit = async () => {
    setPhoneError('');
    if (phone.trim().length < 7) {
      setPhoneError('Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, quantity, phone: phone.trim(), customerNotes: customerNotes.trim() || undefined }),
      });
      if (!res.ok) {
        if (res.status === 409) throw new Error('Not enough spots left for this timeslot.');
        throw new Error('Failed to create reservation');
      }
      const reservation = await res.json();

      const appliedVoucherCode = voucher.status === 'valid' ? voucher.code : undefined;
      const appliedPromoCode = promo.status === 'valid' ? promo.code : undefined;

      const checkout = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: reservation.id,
          ...(appliedVoucherCode ? { voucherCode: appliedVoucherCode } : {}),
          ...(appliedPromoCode ? { promoCode: appliedPromoCode } : {}),
        }),
      });
      const data = await checkout.json();
      if (!checkout.ok) {
        throw new Error(data.error || 'Payment setup failed. Please try again.');
      }

      if (data.free) {
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

  const buttonLabel = loading
    ? t('processing')
    : voucher.status === 'valid' || promo.status === 'valid'
    ? t('bookNowVoucher')
    : t('bookNow');

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="reserve-quantity" className="text-sm font-medium text-gray-700 block mb-1">
          {t('participants')}
        </label>
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
            setQuantity(Number.isFinite(v) ? Math.min(Math.max(1, v), max) : 1);
          }}
        />
        {remaining > 0 ? (
          <p className="text-xs text-gray-500 mt-1">{remaining === 1 ? t('spotsLeft', { n: remaining }) : t('spotsLeftPlural', { n: remaining })}</p>
        ) : (
          <p className="text-xs text-red-600 mt-1">{t('soldOut')}</p>
        )}
      </div>

      <div>
        <label htmlFor="reserve-phone" className="text-sm font-medium text-gray-700 block mb-1">
          Phone number <span aria-hidden="true">*</span>
        </label>
        <input
          id="reserve-phone"
          type="tel"
          required
          className="border rounded px-3 py-2 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (phoneError) setPhoneError('');
          }}
        />
        {phoneError && <p className="text-xs text-red-600 mt-1">{phoneError}</p>}
      </div>

      <div>
        <label htmlFor="reserve-notes" className="text-sm font-medium text-gray-700 block mb-1">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="reserve-notes"
          className="border rounded px-3 py-2 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] resize-none"
          rows={3}
          maxLength={500}
          placeholder="Any special requests or notes?"
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
        />
      </div>

      {/* Gift voucher */}
      <div className="border-t pt-3">
        <button
          type="button"
          className="text-sm text-[#c99706] hover:underline focus:outline-none flex items-center gap-1"
          onClick={() => setVoucherOpen((o) => !o)}
        >
          <svg className={`w-4 h-4 transition-transform ${voucherOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {t('haveVoucher')}
        </button>

        {voucherOpen && (
          <div className="mt-2 space-y-2">
            {voucher.status !== 'valid' && (
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
                  {voucher.status === 'checking' ? t('checking') : t('apply')}
                </button>
              </div>
            )}

            {voucher.status === 'valid' && voucher.amountCents !== undefined && (
              <div className="flex items-center justify-between rounded bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
                <span>{t('voucherApplied', { code: voucher.code, amount: (voucher.amountCents / 100).toFixed(2) })}</span>
                <button type="button" className="ml-3 text-green-600 hover:text-green-800 underline text-xs" onClick={clearVoucher}>
                  {t('removeVoucher')}
                </button>
              </div>
            )}

            {voucher.status === 'invalid' && (
              <p className="text-sm text-red-600">{voucher.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Promo code */}
      <div className="border-t pt-3">
        <button
          type="button"
          className="text-sm text-[#c99706] hover:underline focus:outline-none flex items-center gap-1"
          onClick={() => setPromoOpen((o) => !o)}
        >
          <svg className={`w-4 h-4 transition-transform ${promoOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Have a promo code?
        </button>

        {promoOpen && (
          <div className="mt-2 space-y-2">
            {promo.status !== 'valid' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="border rounded px-3 py-2 flex-1 uppercase tracking-widest text-sm font-mono"
                  placeholder="PROMO-CODE"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value.toUpperCase());
                    if (promo.status !== 'idle') setPromo({ code: '', status: 'idle' });
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyPromo(); }}
                />
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-[#c99706] text-white text-sm hover:bg-[#b3860a] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={applyPromo}
                  disabled={promo.status === 'checking' || promoInput.trim().length === 0}
                >
                  {promo.status === 'checking' ? 'Checking...' : 'Apply'}
                </button>
              </div>
            )}

            {promo.status === 'valid' && promo.discountCents !== undefined && (
              <div className="flex items-center justify-between rounded bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
                <span>
                  Promo <strong>{promo.code}</strong> applied — saving{' '}
                  <strong>&euro;{(promo.discountCents / 100).toFixed(2)}</strong>
                  {promo.type === 'PERCENTAGE' && ` (${promo.value}% off)`}
                </span>
                <button type="button" className="ml-3 text-green-600 hover:text-green-800 underline text-xs" onClick={clearPromo}>
                  Remove
                </button>
              </div>
            )}

            {promo.status === 'invalid' && (
              <p className="text-sm text-red-600">{promo.error}</p>
            )}
          </div>
        )}
      </div>

      <button
        className="w-full bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold rounded-lg px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        disabled={loading || remaining <= 0}
        onClick={submit}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
