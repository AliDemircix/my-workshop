import type { ReactNode } from 'react';
import AdminNav from '@/components/admin/AdminNav';
import AdminSidebarToggle from '@/components/admin/AdminSidebarToggle';
import { isAdminAuthenticated } from '@/lib/auth';

export const runtime = 'nodejs';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const isAdmin = isAdminAuthenticated();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <AdminSidebarToggle />
        <span className="text-base font-bold text-gray-900">Admin Dashboard</span>
      </div>

      <div className="flex">
        {/* Sidebar — hidden on mobile until toggled via AdminSidebarToggle */}
        <AdminSidebarToggle asOverlay isAdmin={isAdmin} />

        {/* Desktop sidebar — always visible on md+ */}
        <aside className="hidden md:flex md:flex-col w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <nav className="p-4 flex-1">
            <AdminNav isAdmin={isAdmin} />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 min-w-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
