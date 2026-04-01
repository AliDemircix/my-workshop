"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

/**
 * Two roles, selected by the `asOverlay` prop:
 *
 * 1. asOverlay=false (default): renders the hamburger button in the mobile top bar.
 * 2. asOverlay=true: renders the slide-in sidebar panel + backdrop for mobile.
 *
 * Both instances share state via a simple module-level event pattern so we
 * don't need a context/store for a single layout concern.
 */

// Lightweight event bus so the button and the overlay can communicate without
// threading state through the Server Component layout.
type Listener = (open: boolean) => void;
const listeners = new Set<Listener>();
let globalOpen = false;
function setOpen(value: boolean) {
  globalOpen = value;
  listeners.forEach((l) => l(value));
}

export default function AdminSidebarToggle({
  asOverlay = false,
  isAdmin,
}: {
  asOverlay?: boolean;
  isAdmin?: boolean;
}) {
  const [open, setLocalOpen] = useState(false);
  const pathname = usePathname();

  // Subscribe to the shared open/close signal
  useEffect(() => {
    function sync(value: boolean) {
      setLocalOpen(value);
    }
    listeners.add(sync);
    // Sync initial state in case the other instance already mounted
    setLocalOpen(globalOpen);
    return () => { listeners.delete(sync); };
  }, []);

  // Close overlay when the route changes (user tapped a nav link)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!asOverlay) {
    // Render the hamburger toggle button
    return (
      <button
        type="button"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        onClick={() => setOpen(!globalOpen)}
        className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
      >
        {open ? (
          // X icon
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Hamburger icon
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
    );
  }

  // Render the mobile overlay sidebar
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 md:hidden"
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      {/* Slide-in panel */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col md:hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-900">Admin Dashboard</span>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="p-4 flex-1 overflow-y-auto">
          <AdminNav isAdmin={isAdmin} />
        </nav>
      </aside>
    </>
  );
}
