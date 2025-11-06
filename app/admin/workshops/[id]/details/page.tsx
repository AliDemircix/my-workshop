import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatEUR } from '@/lib/currency';

export default async function WorkshopDetailsPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return notFound();

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      category: true,
      _count: { select: { reservations: true } },
      reservations: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, status: true, quantity: true, createdAt: true },
      },
    },
  });
  if (!session) return notFound();

  const reservedSeats = session.reservations.reduce(
    (sum: number, r: { quantity: number; status: string }) =>
      r.status !== 'CANCELED' && r.status !== 'REFUNDED' ? sum + r.quantity : sum,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Workshop Details</h2>
        <Link href={`/admin/workshops`} className="underline">Back to list</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border rounded p-4 text-sm">
        <div>
          <div className="text-gray-500">Category</div>
          <div className="font-medium">{session.category.name}</div>
        </div>
        <div>
          <div className="text-gray-500">Date</div>
          <div className="font-medium">{new Date(session.date).toDateString()}</div>
        </div>
        <div>
          <div className="text-gray-500">Time</div>
          <div className="font-medium">{format(new Date(session.startTime), 'HH:mm')}–{format(new Date(session.endTime), 'HH:mm')}</div>
        </div>
        <div>
          <div className="text-gray-500">Capacity</div>
          <div className="font-medium">{reservedSeats}/{session.capacity}</div>
        </div>
        <div>
          <div className="text-gray-500">Price</div>
          <div className="font-medium">{formatEUR(session.priceCents)}</div>
        </div>
        <div>
          <div className="text-gray-500">Status</div>
          <div className="font-medium">
            {(() => {
              const now = new Date();
              const end = new Date(session.endTime);
              const isFinished = end < now;
              const isFull = reservedSeats >= session.capacity;
              return isFinished ? 'Finished' : isFull ? 'Ready (full)' : 'In progress';
            })()}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-md overflow-hidden">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm">
              <th className="px-3 py-2 border-b">Name</th>
              <th className="px-3 py-2 border-b">Email</th>
              <th className="px-3 py-2 border-b">Qty</th>
              <th className="px-3 py-2 border-b">Payment Status</th>
              <th className="px-3 py-2 border-b">Booked At</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {session.reservations.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-sm text-gray-500" colSpan={5}>No reservations yet.</td>
              </tr>
            ) : (
              session.reservations.map((r: { id: number; name: string; email: string; status: string; quantity: number; createdAt: Date }) => (
                <tr key={r.id} className="text-sm">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{r.quantity}</td>
                  <td className="px-3 py-2">
                    {r.status === 'PAID' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Paid</span>
                    ) : r.status === 'REFUNDED' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Refunded</span>
                    ) : r.status === 'CANCELED' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800">Canceled</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
