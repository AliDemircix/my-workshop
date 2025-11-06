"use server";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logout() {
  // Remove the admin cookie
  cookies().delete('admin');
  redirect('/admin/login');
}
