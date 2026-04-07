"use client";

import { useState } from 'react';

type WaitlistState = 'idle' | 'open' | 'submitting' | 'success' | 'error';

export default function WaitlistInlineForm({ sessionId }: { sessionId: number }) {
  const [state, setState] = useState<WaitlistState>('idle');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('submitting');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, name, email }),
      });
      if (res.ok) {
        setState('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(
          typeof data?.error === 'string' ? data.error : 'Something went wrong. Please try again.',
        );
        setState('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <p className="mt-2 text-xs text-green-700 bg-green-50 rounded px-3 py-2">
        You&apos;re on the waitlist! We&apos;ll email you if a spot opens up.
      </p>
    );
  }

  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setState('open')}
        className="mt-2 w-full text-xs text-[#c99706] underline underline-offset-2 hover:text-amber-700 text-left"
      >
        Notify me if a spot opens up
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-1.5">
      {state === 'error' && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{errorMsg}</p>
      )}
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#c99706]"
      />
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#c99706]"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="flex-1 bg-[#c99706] text-white text-xs rounded px-3 py-1.5 hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {state === 'submitting' ? 'Submitting…' : 'Notify me'}
        </button>
        <button
          type="button"
          onClick={() => { setState('idle'); setErrorMsg(''); }}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
