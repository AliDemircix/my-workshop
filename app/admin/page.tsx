import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatEUR } from '@/lib/currency';
import { format, startOfWeek, addWeeks } from 'date-fns';
import RevenueChart from '@/components/admin/RevenueChart';
import CategoryStats from '@/components/admin/CategoryStats';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // ── Weekly revenue for the last 12 weeks ─────────────────────────────────
  // Build week buckets manually (SQLite has limited date functions)
  const twelveWeeksAgo = addWeeks(startOfWeek(now, { weekStartsOn: 1 }), -11);

  const [
    todayReservations,
    paidToday,
    recentReservations,
    totalReservations,
    upcomingSessions,
    paidLast12Weeks,
    allCategories,
    allPaidReservations,
    redeemedVouchers,
  ] = await Promise.all([
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
    // PAID reservations in the last 12 weeks (for revenue chart)
    prisma.reservation.findMany({
      where: {
        status: 'PAID',
        createdAt: { gte: twelveWeeksAgo },
      },
      select: {
        quantity: true,
        createdAt: true,
        session: { select: { priceCents: true } },
      },
    }),
    // All categories (for category stats)
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    // All PAID reservations with session info (for category stats)
    prisma.reservation.findMany({
      where: { status: 'PAID' },
      select: {
        quantity: true,
        session: {
          select: {
            priceCents: true,
            capacity: true,
            categoryId: true,
          },
        },
      },
    }),
    // Redeemed gift vouchers (revenue) — use redeemedByReservationId as proxy for redeemed
    prisma.giftVoucher.findMany({
      where: { redeemedByReservationId: { not: null } },
      select: { amountCents: true },
    }),
  ]);

  const todayRevenueCents = paidToday.reduce(
    (sum, r) => sum + r.session.priceCents * (r as any).quantity,
    0,
  );

  // ── Build weekly revenue chart data ──────────────────────────────────────
  const weekLabels: { label: string; start: Date; end: Date }[] = [];
  for (let i = 0; i < 12; i++) {
    const weekStart = addWeeks(twelveWeeksAgo, i);
    const weekEnd = addWeeks(weekStart, 1);
    weekLabels.push({
      label: format(weekStart, 'dd MMM'),
      start: weekStart,
      end: weekEnd,
    });
  }

  const revenueChartData = weekLabels.map(({ label, start, end }) => {
    const weekRevenueCents = paidLast12Weeks
      .filter((r) => r.createdAt >= start && r.createdAt < end)
      .reduce((sum, r) => sum + r.session.priceCents * r.quantity, 0);
    return { period: label, revenue: weekRevenueCents / 100 };
  });

  // ── Build per-category stats ──────────────────────────────────────────────
  const categoryStatsMap = new Map<
    number,
    { bookings: number; revenueCents: number; fillRateSum: number; fillRateCount: number }
  >();
  for (const cat of allCategories) {
    categoryStatsMap.set(cat.id, { bookings: 0, revenueCents: 0, fillRateSum: 0, fillRateCount: 0 });
  }
  for (const r of allPaidReservations) {
    const entry = categoryStatsMap.get(r.session.categoryId);
    if (!entry) continue;
    entry.bookings += r.quantity;
    entry.revenueCents += r.session.priceCents * r.quantity;
    if (r.session.capacity > 0) {
      entry.fillRateSum += r.quantity / r.session.capacity;
      entry.fillRateCount += 1;
    }
  }

  const categoryStats = allCategories.map((cat) => {
    const entry = categoryStatsMap.get(cat.id)!;
    return {
      name: cat.name,
      bookings: entry.bookings,
      revenue: entry.revenueCents / 100,
      fillRate: entry.fillRateCount > 0 ? (entry.fillRateSum / entry.fillRateCount) * 100 : 0,
    };
  }).filter((s) => s.bookings > 0);

  // ── Gift voucher redemption revenue ──────────────────────────────────────
  const voucherRevenueCents = redeemedVouchers.reduce((sum, v) => sum + v.amountCents, 0);

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

      {/* Revenue chart */}
      <RevenueChart data={revenueChartData} />

      {/* Category performance */}
      <CategoryStats stats={categoryStats} />

      {/* Gift voucher revenue summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Gift voucher redemptions</p>
          <p className="text-xs text-gray-400 mt-0.5">Total value of redeemed gift vouchers</p>
        </div>
        <p className="text-2xl font-bold text-[#c99706]">{formatEUR(voucherRevenueCents)}</p>
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
