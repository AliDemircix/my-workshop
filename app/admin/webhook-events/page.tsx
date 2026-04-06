import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export default async function AdminWebhookEventsPage() {
  const events = await prisma.webhookEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Webhook Events</h1>
        <p className="text-gray-600 mt-1">
          Dead-letter log of the last 100 Stripe webhook events processed by this application.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-md overflow-hidden">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm">
              <th className="px-3 py-2 border-b">Stripe Event ID</th>
              <th className="px-3 py-2 border-b">Type</th>
              <th className="px-3 py-2 border-b">Status</th>
              <th className="px-3 py-2 border-b">Created At</th>
              <th className="px-3 py-2 border-b">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500">
                  No webhook events recorded yet.
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="text-sm hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs text-gray-700">{e.stripeEventId}</td>
                <td className="px-3 py-2 text-gray-700">{e.type}</td>
                <td className="px-3 py-2">
                  {e.status === 'PROCESSED' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      PROCESSED
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      FAILED
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                  {new Date(e.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-gray-500 max-w-xs truncate" title={e.errorMessage ?? ''}>
                  {e.errorMessage ? (
                    <span className="text-red-600">{e.errorMessage.slice(0, 120)}{e.errorMessage.length > 120 ? '…' : ''}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
