import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
  const logs = await (prisma as any).auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600 mt-1">Last 100 admin actions</p>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-gray-500">No audit entries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-2 border-b font-medium text-gray-600 whitespace-nowrap">Timestamp</th>
                <th className="px-4 py-2 border-b font-medium text-gray-600">Action</th>
                <th className="px-4 py-2 border-b font-medium text-gray-600">Entity Type</th>
                <th className="px-4 py-2 border-b font-medium text-gray-600">Entity ID</th>
                <th className="px-4 py-2 border-b font-medium text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log: { id: number; createdAt: Date; action: string; entityType: string; entityId: string; details: string | null }) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                    {format(new Date(log.createdAt), 'd MMM yyyy, HH:mm:ss')}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{log.entityType}</td>
                  <td className="px-4 py-2 text-gray-700">{log.entityId}</td>
                  <td className="px-4 py-2 text-gray-500 max-w-xs">
                    {log.details ? (
                      <span title={log.details} className="truncate block max-w-[20rem]">
                        {log.details.length > 80 ? `${log.details.slice(0, 80)}…` : log.details}
                      </span>
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
