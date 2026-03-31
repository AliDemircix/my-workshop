import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export function isAdminAuthenticated() {
  const cookieStore = cookies();
  return cookieStore.get('admin')?.value === '1';
}

/**
 * Use in API route handlers. Throws so the caller can return a 401 response.
 */
export function requireAdmin() {
  if (!isAdminAuthenticated()) {
    throw new Error('UNAUTHORIZED');
  }
}

/**
 * Use in Server Actions. Redirects to the login page instead of throwing,
 * so Next.js can render the login page rather than an unhandled error.
 */
export function requireAdminAction() {
  if (!isAdminAuthenticated()) {
    redirect('/admin/login');
  }
}
