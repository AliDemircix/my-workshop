"use client";

import Link from 'next/link';
import { logout } from '@/app/admin/actions';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

type Props = { isAdmin?: boolean };

export default function AdminNav({ isAdmin = false }: Props) {
  const pathname = usePathname() || '/admin';
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/admin/settings')) {
      setSettingsOpen(true);
    }
  }, [pathname]);

  const navItems = [
    {
      href: '/admin/reservations',
      label: 'Reservations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      href: '/admin/workshops',
      label: 'Workshops',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      href: '/admin/categories',
      label: 'Categories',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    {
      href: '/admin/pages/home-categories',
      label: 'Home Categories',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m7 7 5 5 5-5" />
        </svg>
      )
    },
    {
      href: '/admin/gift-cards',
      label: 'Gift Cards',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      href: '/admin/vouchers',
      label: 'Gift Vouchers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      )
    },
    {
      href: '/admin/newsletter',
      label: 'Newsletter',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
  ];

  const settingsSubItems = [
    { href: '/admin/settings/contact', label: 'Contact Info' },
    { href: '/admin/settings/policy', label: 'Policy & Pages' },
    { href: '/admin/settings/social', label: 'Social Links' },
    { href: '/admin/settings/branding', label: 'Branding' },
    { href: '/admin/settings/slider', label: 'Slider Images' },
    { href: '/admin/settings/maintenance', label: 'Maintenance Mode' },
    { href: '/admin/settings/testimonials', label: 'Testimonials' },
  ];

  const isSettingsActive = pathname.startsWith('/admin/settings');

  return (
    <div className="space-y-6">
      {/* Navigation Links */}
      <ul className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#c99706] text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-gray-400'}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}

        {/* Settings expandable group */}
        <li>
          <button
            type="button"
            onClick={() => setSettingsOpen((prev) => !prev)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isSettingsActive
                ? 'bg-[#c99706] text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className={isSettingsActive ? 'text-white' : 'text-gray-400'}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span className="flex-1 text-left">Settings</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''} ${isSettingsActive ? 'text-white' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {settingsOpen && (
            <ul className="mt-1 space-y-1">
              {settingsSubItems.map((sub) => {
                const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                return (
                  <li key={sub.href}>
                    <Link
                      href={sub.href}
                      className={`flex items-center pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSubActive
                          ? 'bg-[#c99706] text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {sub.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      </ul>

      {/* Logout Button */}
      {isAdmin && pathname !== '/admin/login' && (
        <div className="pt-4 border-t border-gray-200">
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
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
