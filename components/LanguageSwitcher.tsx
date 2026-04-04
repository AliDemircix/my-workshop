"use client";

import { useTransition, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type LocaleCode = 'en' | 'nl' | 'tr';

// Inline SVG flag components — no external deps needed
function FlagGB({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <clipPath id="gb-clip">
        <path d="M0 0v30h60V0z"/>
      </clipPath>
      <path d="M0 0v30h60V0z" fill="#012169"/>
      <path d="M0 0l60 30M60 0L0 30" stroke="#fff" strokeWidth="6"/>
      <path d="M0 0l60 30M60 0L0 30" stroke="#C8102E" strokeWidth="4" clipPath="url(#gb-clip)"/>
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6"/>
    </svg>
  );
}

function FlagNL({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 9 6" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="9" height="6" fill="#21468B"/>
      <rect width="9" height="4" fill="#fff"/>
      <rect width="9" height="2" fill="#AE1C28"/>
    </svg>
  );
}

function FlagTR({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="30" height="20" fill="#E30A17"/>
      <circle cx="11" cy="10" r="6" fill="#fff"/>
      <circle cx="13" cy="10" r="4.8" fill="#E30A17"/>
      <polygon points="18,10 21.5,11.1 20.3,7.7 22.8,9.8 22.8,10.2 20.3,12.3 21.5,8.9" fill="#fff"/>
    </svg>
  );
}

const LOCALES: { code: LocaleCode; label: string; Flag: React.FC<{ className?: string }> }[] = [
  { code: 'en', label: 'English', Flag: FlagGB },
  { code: 'nl', label: 'Nederlands', Flag: FlagNL },
  { code: 'tr', label: 'Türkçe', Flag: FlagTR },
];

interface Props {
  currentLocale: LocaleCode;
}

export default function LanguageSwitcher({ currentLocale }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCALES.find(l => l.code === currentLocale) ?? LOCALES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  function switchLocale(locale: LocaleCode) {
    setOpen(false);
    if (locale === currentLocale) return;
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative" aria-label="Language selector">
      {/* Trigger button — shows current flag + chevron */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.label}`}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
      >
        <current.Flag className="w-5 h-3.5 rounded-sm shadow-sm object-cover" />
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[200] py-1"
        >
          {LOCALES.map(({ code, label, Flag }) => {
            const isActive = code === currentLocale;
            return (
              <button
                key={code}
                role="option"
                aria-selected={isActive}
                type="button"
                onClick={() => switchLocale(code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100 focus-visible:outline-none focus-visible:bg-amber-50 ${
                  isActive
                    ? 'bg-amber-50 text-[#c99706] font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Flag className="w-6 h-4 rounded-sm shadow-sm flex-shrink-0" />
                <span>{label}</span>
                {isActive && (
                  <svg className="w-4 h-4 ml-auto text-[#c99706]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
