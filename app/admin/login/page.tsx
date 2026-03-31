import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { checkRateLimit, getIpFromHeaders } from '@/lib/rateLimit';

// 5 attempts per 15 minutes per IP
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface Props {
  searchParams: { error?: string; retryAfter?: string };
}

export default function AdminLoginPage({ searchParams }: Props) {
  async function login(formData: FormData) {
    'use server';

    const ip = getIpFromHeaders(headers());
    const rateLimitResult = checkRateLimit(ip, 'admin-login', LOGIN_LIMIT, LOGIN_WINDOW_MS);
    if (!rateLimitResult.allowed) {
      redirect(`/admin/login?error=ratelimit&retryAfter=${rateLimitResult.retryAfterSeconds}`);
    }

    const u = formData.get('username');
    const p = formData.get('password');
    if (u === process.env.ADMIN_USERNAME && p === process.env.ADMIN_PASSWORD) {
      cookies().set('admin', '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 // 24 hours
      });
      redirect('/admin');
    }
    redirect('/admin/login?error=1');
  }

  const isRateLimited = searchParams.error === 'ratelimit';
  const isInvalidCredentials = searchParams.error === '1';
  const retryAfterSeconds = searchParams.retryAfter ? parseInt(searchParams.retryAfter, 10) : null;
  const retryAfterMinutes = retryAfterSeconds !== null ? Math.ceil(retryAfterSeconds / 60) : null;

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg">
      {isRateLimited && (
        <div
          className="mb-4 rounded-md bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          Too many login attempts. Please wait
          {retryAfterMinutes !== null ? ` ${retryAfterMinutes} minute${retryAfterMinutes !== 1 ? 's' : ''}` : ' a few minutes'}{' '}
          before trying again.
        </div>
      )}
      {isInvalidCredentials && (
        <div
          className="mb-4 rounded-md bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          Invalid username or password.
        </div>
      )}
      <form className="space-y-6" action={login}>
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#c99706] focus:border-[#c99706]"
              name="username"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#c99706] focus:border-[#c99706]"
              name="password"
              placeholder="Enter password"
              type="password"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isRateLimited}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#c99706] hover:bg-[#b8860b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c99706] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
