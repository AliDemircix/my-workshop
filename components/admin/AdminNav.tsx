"use client";

import Link from 'next/link';
import { logout } from '@/app/admin/actions';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

type NavLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type NavGroup = {
  key: string;
  label: string;
  icon: React.ReactNode;
  items: Array<{ href: string; label: string }>;
};

type NavEntry = NavLink | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry;
}

const ACCENT = 'bg-[#c99706]';

const navConfig: NavEntry[] = [
  // ── Sales ────────────────────────────────────────────────────────────────
  {
    key: 'sales',
    label: 'Sales',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    items: [
      { href: '/admin/reservations', label: 'Reservations' },
      { href: '/admin/gift-cards', label: 'Gift Cards' },
      { href: '/admin/vouchers', label: 'Gift Vouchers' },
      { href: '/admin/promo-codes', label: 'Promo Codes' },
    ],
  },

  // ── Catalog ───────────────────────────────────────────────────────────────
  {
    key: 'catalog',
    label: 'Catalog',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    items: [
      { href: '/admin/workshops', label: 'Workshops' },
      { href: '/admin/categories', label: 'Categories' },
      { href: '/admin/pages/home-categories', label: 'Home Categories' },
    ],
  },

  // ── Marketing ─────────────────────────────────────────────────────────────
  {
    key: 'marketing',
    label: 'Marketing',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    items: [
      { href: '/admin/newsletter', label: 'Newsletter' },
      { href: '/admin/private-events', label: 'Private Events' },
      { href: '/admin/reviews', label: 'Reviews' },
    ],
  },

  // ── System ────────────────────────────────────────────────────────────────
  {
    key: 'system',
    label: 'System',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
    items: [
      { href: '/admin/webhook-events', label: 'Webhook Events' },
      { href: '/admin/audit-log', label: 'Audit Log' },
    ],
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  {
    key: 'settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    items: [
      { href: '/admin/settings/contact', label: 'Contact Info' },
      { href: '/admin/settings/policy', label: 'Policy & Pages' },
      { href: '/admin/settings/social', label: 'Social Links' },
      { href: '/admin/settings/branding', label: 'Branding' },
      { href: '/admin/settings/slider', label: 'Slider Images' },
      { href: '/admin/settings/maintenance', label: 'Maintenance Mode' },
      { href: '/admin/settings/testimonials', label: 'Testimonials' },
    ],
  },
];

// Groups open by default on first render
const DEFAULT_OPEN: Record<string, boolean> = { sales: true, catalog: true };

type Props = { isAdmin?: boolean };

export default function AdminNav({ isAdmin = false }: Props) {
  const pathname = usePathname() || '/admin';
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(DEFAULT_OPEN);

  // Auto-expand any group that contains the active route (never auto-collapse)
  useEffect(() => {
    const updates: Record<string, boolean> = {};
    for (const entry of navConfig) {
      if (isGroup(entry)) {
        const active = entry.items.some(
          (item) => pathname === item.href || pathname.startsWith(item.href + '/')
        );
        if (active) updates[entry.key] = true;
      }
    }
    if (Object.keys(updates).length > 0) {
      setOpenGroups((prev) => ({ ...prev, ...updates }));
    }
  }, [pathname]);

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-1">
      <ul className="space-y-0.5">
        {navConfig.map((entry) => {
          if (isGroup(entry)) {
            const isOpen = !!openGroups[entry.key];
            const hasActiveChild = entry.items.some(
              (item) => pathname === item.href || pathname.startsWith(item.href + '/')
            );

            return (
              <li key={entry.key}>
                {/* Group header */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`group-${entry.key}`}
                  onClick={() => toggleGroup(entry.key)}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    hasActiveChild
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className={hasActiveChild ? 'text-[#c99706]' : 'text-gray-400'}>
                    {entry.icon}
                  </span>
                  <span className="flex-1 text-left tracking-wide uppercase text-xs">
                    {entry.label}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''} ${hasActiveChild ? 'text-[#c99706]' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Children */}
                {isOpen && (
                  <ul id={`group-${entry.key}`} className="mt-0.5 mb-1 space-y-0.5">
                    {entry.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`flex items-center pl-10 pr-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isActive
                                ? `${ACCENT} text-white shadow-sm`
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          }

          // Standalone link (not used currently, kept for future top-level items)
          const link = entry as NavLink;
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? `${ACCENT} text-white shadow-sm`
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-gray-400'}>{link.icon}</span>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Logout */}
      {isAdmin && pathname !== '/admin/login' && (
        <div className="pt-3 mt-2 border-t border-gray-200">
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
