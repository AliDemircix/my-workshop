import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Admin auth guard (existing behaviour) ---
  if (pathname.startsWith('/admin')) {
    const isLogged = request.cookies.get('admin')?.value === '1';
    if (!isLogged && pathname !== '/admin/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
    // Admin users always bypass maintenance mode — let them through.
    return NextResponse.next();
  }

  // --- Maintenance mode guard ---
  // Skip the maintenance page itself and all API routes to avoid redirect loops
  // and allow the maintenance API endpoint to remain reachable.
  if (pathname === '/maintenance' || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Admin cookie holders (logged-in admins browsing the public site) bypass
  // maintenance mode so they can preview the site while it is under maintenance.
  const isAdmin = request.cookies.get('admin')?.value === '1';
  if (isAdmin) {
    return NextResponse.next();
  }

  // Check maintenance mode by calling the internal API endpoint.
  // The response is cached (s-maxage=15) so this does not hit the DB on every request.
  try {
    const statusUrl = new URL('/api/internal/maintenance-status', request.nextUrl.origin);
    const res = await fetch(statusUrl.toString(), { next: { revalidate: 15 } } as RequestInit);
    if (res.ok) {
      const { active } = await res.json();
      if (active) {
        const url = request.nextUrl.clone();
        url.pathname = '/maintenance';
        return NextResponse.redirect(url);
      }
    }
  } catch {
    // Fail open — if the status check errors, never block public traffic.
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static assets and Next.js internals.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};
