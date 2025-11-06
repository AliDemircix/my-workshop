"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

type Props = { isAdmin?: boolean };

export default function Nav({ isAdmin = false }: Props) {
  const pathname = usePathname() || '/';

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const base = 'underline underline-offset-4';
  const inactive = 'text-gray-300 hover:text-white hover:decoration-2';
  const active = 'text-white font-semibold decoration-2';

  const adminIsActive = isActive('/admin');

  return (
  <nav className="mt-0 flex items-center gap-4 text-sm">
      <Link
        className={clsx(base, isActive('/') ? active : inactive)}
        href="/"
        aria-current={isActive('/') ? 'page' : undefined}
      >
        Home
      </Link>
      <a
        className={clsx(base, inactive)}
        href="https://giftoria.nl"
      >
        Webshop
      </a>
      {/* Reserve link removed; Reserve is now the home page */}

      {isAdmin && (
        <Link
          className={clsx(base, adminIsActive ? active : inactive)}
          href="/admin"
          aria-current={adminIsActive ? 'page' : undefined}
        >
          Admin
        </Link>
      )}
    </nav>
  );
}
