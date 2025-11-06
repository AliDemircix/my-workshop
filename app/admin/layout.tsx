import type { ReactNode } from 'react';
import AdminNav from '@/components/admin/AdminNav';
import { isAdminAuthenticated } from '@/lib/auth';

export const runtime = 'nodejs';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const isAdmin = isAdminAuthenticated();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <nav className="p-4">
            <AdminNav isAdmin={isAdmin} />
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
