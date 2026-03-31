import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatEUR } from '@/lib/currency';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [todayReservations, paidToday, recentReservations, totalReservations, upcomingSessions] = await Promise.all([
    // Today's reservations count
    prisma.reservation.count({
      where: { createdAt: { gte: todayStart, lt: todayEnd } },
    }),
    // Today's revenue (PAID reservations created today)
    prisma.reservation.findMany({
      where: {
        createdAt: { gte: todayStart, lt: todayEnd },
        status: 'PAID',
      },
      include: { session: { select: { priceCents: true } } },
    }),
    // Recent 5 reservations
    prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { session: { include: { category: true } } },
    }),
    // Total all-time
    prisma.reservation.count(),
    // Upcoming sessions
    prisma.session.count({
      where: { date: { gte: now } },
    }),
  ]);

  const todayRevenueCents = paidToday.reduce((sum, r) => sum + r.session.priceCents * (r as any).quantity, 0);

  const statusColor: Record<string, string> = {
    PAID: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    CANCELED: 'bg-gray-100 text-gray-600',
    REFUNDED: 'bg-red-100 text-red-800',
    REFUNDING: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of today&apos;s activity</p>
      </div>

      {/* Summary widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-1">
          <p className="text-sm text-gray-500">Today&apos;s bookings</p>
          <p className="text-3xl font-bold text-gray-900">{todayReservations}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-1">
          <p className="text-sm text-gray-500">Today&apos;s revenue</p>
          <p className="text-3xl font-bold text-[#c99706]">{formatEUR(todayRevenueCents)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-1">
          <p className="text-sm text-gray-500">Total reservations</p>
          <p className="text-3xl font-bold text-gray-900">{totalReservations}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-1">
          <p className="text-sm text-gray-500">Upcoming sessions</p>
          <p className="text-3xl font-bold text-gray-900">{upcomingSessions}</p>
        </div>
      </div>

      {/* Recent reservations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Reservations</h2>
          <Link href="/admin/reservations" className="text-sm text-[#c99706] hover:underline">
            View all →
          </Link>
        </div>

        {recentReservations.length === 0 ? (
          <p className="text-sm text-gray-500">No reservations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-2 border-b font-medium text-gray-600">Name</th>
                  <th className="px-4 py-2 border-b font-medium text-gray-600">Workshop</th>
                  <th className="px-4 py-2 border-b font-medium text-gray-600">Date</th>
                  <th className="px-4 py-2 border-b font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 border-b font-medium text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentReservations.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2">{r.session.category.name}</td>
                    <td className="px-4 py-2">{format(new Date(r.session.date), 'd MMM yyyy')}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor[r.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{format(new Date(r.createdAt), 'd MMM, HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Reservations', href: '/admin/reservations' },
          { label: 'Workshops', href: '/admin/workshops' },
          { label: 'Categories', href: '/admin/categories' },
          { label: 'Settings', href: '/admin/settings' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white border border-gray-200 hover:border-[#c99706] hover:text-[#c99706] rounded-xl px-4 py-3 text-sm font-medium text-gray-700 text-center transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
