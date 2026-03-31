import { prisma } from '@/lib/prisma';
import { formatEUR } from '@/lib/currency';
import { requireAdminAction } from '@/lib/auth';

type StatusKey = 'PENDING' | 'PAID' | 'USED' | 'EXPIRED';

const STATUS_BADGE: Record<StatusKey, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-gray-100 text-gray-700' },
  PAID: { label: 'Paid', className: 'bg-blue-100 text-blue-700' },
  USED: { label: 'Used', className: 'bg-green-100 text-green-700' },
  EXPIRED: { label: 'Expired', className: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_BADGE[status as StatusKey] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

export default async function VouchersPage() {
  requireAdminAction();

  const vouchers = await prisma.giftVoucher.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Gift Vouchers</h1>
        <p className="text-gray-600 mt-1">All purchased gift vouchers and their redemption status</p>
      </div>

      <div className="text-sm text-gray-700">
        Total vouchers: <span className="font-semibold">{vouchers.length}</span>
      </div>

      {vouchers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
          No gift vouchers have been purchased yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-md overflow-hidden">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm">
                <th className="px-3 py-2 border-b">Code</th>
                <th className="px-3 py-2 border-b">Amount</th>
                <th className="px-3 py-2 border-b">Purchaser</th>
                <th className="px-3 py-2 border-b">Recipient</th>
                <th className="px-3 py-2 border-b">Status</th>
                <th className="px-3 py-2 border-b">Created</th>
                <th className="px-3 py-2 border-b">Expires</th>
                <th className="px-3 py-2 border-b">Reservation</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vouchers.map((v) => (
                <tr key={v.id} className="text-sm hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono tracking-wide text-gray-900">{v.code}</td>
                  <td className="px-3 py-2">{formatEUR(v.amountCents)}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">{v.purchaserName}</div>
                    <div className="text-xs text-gray-500">{v.purchaserEmail}</div>
                  </td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{v.recipientEmail ?? '—'}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-3 py-2 text-gray-600">{new Date(v.createdAt).toDateString()}</td>
                  <td className="px-3 py-2 text-gray-600">{new Date(v.expiresAt).toDateString()}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {v.redeemedByReservationId ? (
                      <span className="font-medium text-green-700">#{v.redeemedByReservationId}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
