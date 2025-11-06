import { cookies } from 'next/headers';

export function isAdminAuthenticated() {
  const cookieStore = cookies();
  return cookieStore.get('admin')?.value === '1';
}

export function requireAdmin() {
  if (!isAdminAuthenticated()) {
    throw new Error('UNAUTHORIZED');
  }
}
