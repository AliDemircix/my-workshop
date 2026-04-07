"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
}

interface Props {
  categories: Category[];
}

export default function PrivateEventForm({ categories }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    groupSize: '',
    preferredDates: '',
    categoryId: '',
    message: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Please enter a valid email';
    const size = parseInt(form.groupSize, 10);
    if (!form.groupSize || isNaN(size) || size < 1) next.groupSize = 'Please enter a valid group size';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/private-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          groupSize: parseInt(form.groupSize, 10),
          preferredDates: form.preferredDates.trim() || undefined,
          categoryId: form.categoryId ? parseInt(form.categoryId, 10) : undefined,
          message: form.message.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit inquiry');
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
        <h2 className="text-xl font-bold text-gray-900">Inquiry received!</h2>
        <p className="text-gray-600">
          Thank you for your interest in a private workshop. We will review your request and get back
          to you within 1–2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Name */}
        <div>
          <label htmlFor="pe-name" className="block text-sm font-medium text-gray-700 mb-1">
            Your name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="pe-name"
            type="text"
            required
            value={form.name}
            onChange={set('name')}
            className={`w-full border rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="pe-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="pe-email"
            type="email"
            required
            value={form.email}
            onChange={set('email')}
            className={`w-full border rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="pe-phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="pe-phone"
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
          />
        </div>

        {/* Group size */}
        <div>
          <label htmlFor="pe-group" className="block text-sm font-medium text-gray-700 mb-1">
            Group size <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="pe-group"
            type="number"
            min="1"
            required
            value={form.groupSize}
            onChange={set('groupSize')}
            placeholder="e.g. 10"
            className={`w-full border rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] ${errors.groupSize ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.groupSize && <p className="text-xs text-red-600 mt-1">{errors.groupSize}</p>}
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="pe-category" className="block text-sm font-medium text-gray-700 mb-1">
          Workshop type <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <select
          id="pe-category"
          value={form.categoryId}
          onChange={set('categoryId')}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
        >
          <option value="">No preference / not sure yet</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Preferred dates */}
      <div>
        <label htmlFor="pe-dates" className="block text-sm font-medium text-gray-700 mb-1">
          Preferred date range <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="pe-dates"
          type="text"
          value={form.preferredDates}
          onChange={set('preferredDates')}
          placeholder="e.g. weekend of 15 June or any Saturday in July"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="pe-message" className="block text-sm font-medium text-gray-700 mb-1">
          Additional message <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="pe-message"
          rows={4}
          maxLength={2000}
          value={form.message}
          onChange={set('message')}
          placeholder="Any special requests, theme ideas, or other details we should know?"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold rounded-lg px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending inquiry...' : 'Send Inquiry'}
      </button>
    </form>
  );
}
