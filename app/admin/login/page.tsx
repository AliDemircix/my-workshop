import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function AdminLoginPage() {
  async function login(formData: FormData) {
    'use server';
    const u = formData.get('username');
    const p = formData.get('password');
    if (u === process.env.ADMIN_USERNAME && p === process.env.ADMIN_PASSWORD) {
      cookies().set('admin', '1', { httpOnly: false, sameSite: 'lax' });
      redirect('/admin');
    }
    redirect('/admin/login?error=1');
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg">
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
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#c99706] hover:bg-[#b8860b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c99706]"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
