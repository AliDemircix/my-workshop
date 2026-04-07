import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { sendPrivateEventClosedEmail } from '@/lib/mailer';
import PrivateEventsClient from '@/components/admin/PrivateEventsClient';

export const runtime = 'nodejs';

type StatusValue = 'NEW' | 'IN_PROGRESS' | 'CLOSED';

export default async function AdminPrivateEventsPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  async function updateStatus(formData: FormData) {
    'use server';
    requireAdminAction();

    const id = Number(formData.get('id'));
    const status = String(formData.get('status') || '') as StatusValue;
    const closingMessage = String(formData.get('closingMessage') || '').trim() || undefined;
    if (!id || !['NEW', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
      redirect('/admin/private-events');
    }

    const existing = await prisma.privateEventRequest.findUnique({
      where: { id },
      include: { category: { select: { name: true } } },
    });

    await prisma.privateEventRequest.update({ where: { id }, data: { status } });
    logAction('PRIVATE_EVENT_STATUS_UPDATED', 'PrivateEventRequest', String(id), { status });

    if (status === 'CLOSED' && existing && existing.status !== 'CLOSED') {
      try {
        await sendPrivateEventClosedEmail({
          to: existing.email,
          customerName: existing.name,
          categoryName: existing.category?.name,
          message: closingMessage,
        });
      } catch (err) {
        console.error(`Failed to send closing email for private event ${id}:`, err);
      }
    }

    revalidatePath('/admin/private-events');
    redirect('/admin/private-events');
  }

  const statusFilter = searchParams?.status as StatusValue | undefined;

  const requests = await prisma.privateEventRequest.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { category: { select: { id: true, name: true } } },
  });

  const counts = await prisma.privateEventRequest.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const countMap: Record<string, number> = {};
  for (const c of counts) countMap[c.status] = c._count.id;

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Private Event Inquiries</h1>
        <p className="text-gray-600 mt-1">Manage group and private workshop booking requests</p>
      </div>

      <PrivateEventsClient
        requests={requests as any}
        countMap={countMap}
        currentFilter={statusFilter}
        updateStatusAction={updateStatus}
      />
    </div>
  );
}
