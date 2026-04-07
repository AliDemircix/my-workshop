"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface Props {
  token: string;
  customerName: string;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] rounded"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <svg
            className={`w-10 h-10 transition-colors ${
              star <= (hover || value) ? 'text-[#c99706]' : 'text-gray-200'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewForm({ token, customerName }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(customerName);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Please enter your name';
    if (rating < 1) next.rating = 'Please select a star rating';
    if (text.trim().length < 10) next.text = 'Please write at least 10 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim(), rating, text: text.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Thank you for your review!</h2>
        <p className="text-gray-600">
          Your review has been submitted and will be visible on our website after approval.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5 bg-white rounded-xl border border-gray-200 p-6">
      {/* Name */}
      <div>
        <label htmlFor="rv-name" className="block text-sm font-medium text-gray-700 mb-1">
          Your name <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="rv-name"
          type="text"
          required
          value={name}
          onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => { const n = {...p}; delete n.name; return n; }); }}
          className={`w-full border rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
      </div>

      {/* Star rating */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">
          Overall rating <span className="text-red-500" aria-hidden="true">*</span>
        </p>
        <StarRating value={rating} onChange={(v) => { setRating(v); if (errors.rating) setErrors((p) => { const n = {...p}; delete n.rating; return n; }); }} />
        {errors.rating && <p className="text-xs text-red-600 mt-1">{errors.rating}</p>}
      </div>

      {/* Review text */}
      <div>
        <label htmlFor="rv-text" className="block text-sm font-medium text-gray-700 mb-1">
          Your review <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <textarea
          id="rv-text"
          rows={5}
          maxLength={2000}
          required
          value={text}
          onChange={(e) => { setText(e.target.value); if (errors.text) setErrors((p) => { const n = {...p}; delete n.text; return n; }); }}
          placeholder="Tell us about your experience..."
          className={`w-full border rounded px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] ${errors.text ? 'border-red-400' : 'border-gray-300'}`}
        />
        <p className="text-xs text-gray-400 mt-0.5">{text.length}/2000</p>
        {errors.text && <p className="text-xs text-red-600 mt-1">{errors.text}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold rounded-lg px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
