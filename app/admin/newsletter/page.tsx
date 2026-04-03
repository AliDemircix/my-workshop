"use client";

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import RichTextEditor from '@/components/admin/RichTextEditor';

export default function AdminNewsletterPage() {
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch('/api/mail-list/subscribers')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch subscribers');
        return res.json();
      })
      .then((data: { id: number; email: string; createdAt: string }[]) => {
        setSubscriberCount(data.length);
      })
      .catch(() => {
        setSubscriberCount(null);
      });
  }, []);

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!html.trim() || html === '<p><br></p>') {
      toast.error('Email body is required');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/mail-list/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to send newsletter');
      }
      if (data.warning) {
        toast.error(`SMTP not configured — newsletter not sent (${data.warning})`);
      } else {
        toast.success(`Newsletter sent to ${data.sent} subscriber${data.sent !== 1 ? 's' : ''}`);
        setSubject('');
        setHtml('');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Send Newsletter</h1>
        <span className="text-sm text-gray-500">
          {subscriberCount === null
            ? 'Loading subscribers...'
            : `Sending to ${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}`}
        </span>
      </div>

      <form onSubmit={handleSend} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="subject" className="text-sm font-medium">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Newsletter subject..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email Body</label>
          <RichTextEditor
            value={html}
            onChange={setHtml}
            placeholder="Write your newsletter content here..."
          />
        </div>

        <button
          type="submit"
          disabled={sending || subscriberCount === 0}
          className="bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white rounded px-5 py-2 text-sm font-medium transition-colors"
        >
          {sending ? 'Sending...' : 'Send Newsletter'}
        </button>

        {subscriberCount === 0 && (
          <p className="text-sm text-amber-600">There are no subscribers yet. The send button is disabled.</p>
        )}
      </form>
    </div>
  );
}
