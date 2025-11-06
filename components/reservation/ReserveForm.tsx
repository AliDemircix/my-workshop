"use client";
import { useEffect, useState } from 'react';

export default function ReserveForm({ sessionId, remaining = 0 }: { sessionId: number; remaining?: number }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuantity((q) => {
      const max = Math.max(1, remaining);
      const next = Math.min(Math.max(1, q), max);
      return next;
    });
  }, [remaining]);

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
      const checkout = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: reservation.id }),
      });
      const data = await checkout.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error creating reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 border rounded p-4">
      <h3 className="font-medium">Your details</h3>
      <div className="grid grid-cols-1 gap-3">
        <input className="border rounded px-3 py-2 w-full" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="border rounded px-3 py-2 w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="text-sm mr-2">Number of participants</label>
        <input
          type="number"
          className="border rounded px-3 py-2 w-24"
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
      <button className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading || remaining <= 0} onClick={submit}>
        {loading ? 'Processing…' : 'Reserve & Pay'}
      </button>
    </div>
  );
}
