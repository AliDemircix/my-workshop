import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import AdminReviewsClient from '@/components/admin/AdminReviewsClient';

export const runtime = 'nodejs';

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams?: { filter?: string };
}) {
  async function approveReview(formData: FormData) {
    'use server';
    requireAdminAction();
    const id = Number(formData.get('id'));
    if (!id) redirect('/admin/reviews');
    await prisma.review.update({ where: { id }, data: { approved: true } });
    logAction('REVIEW_APPROVED', 'Review', String(id));
    revalidatePath('/admin/reviews');
    redirect('/admin/reviews');
  }

  async function rejectReview(formData: FormData) {
    'use server';
    requireAdminAction();
    const id = Number(formData.get('id'));
    if (!id) redirect('/admin/reviews');
    await prisma.review.delete({ where: { id } });
    logAction('REVIEW_DELETED', 'Review', String(id));
    revalidatePath('/admin/reviews');
    redirect('/admin/reviews');
  }

  const filter = searchParams?.filter;
  const approvedFilter = filter === 'approved' ? true : filter === 'pending' ? false : undefined;

  const [reviews, pendingCount, approvedCount] = await Promise.all([
    prisma.review.findMany({
      where: approvedFilter !== undefined ? { approved: approvedFilter } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        reservation: {
          select: {
            id: true,
            name: true,
            email: true,
            session: { select: { date: true } },
          },
        },
      },
    }),
    prisma.review.count({ where: { approved: false } }),
    prisma.review.count({ where: { approved: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
        <p className="text-gray-600 mt-1">Approve or remove customer reviews before they go live</p>
      </div>

      <AdminReviewsClient
        reviews={reviews as any}
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        currentFilter={filter}
        approveAction={approveReview}
        rejectAction={rejectReview}
      />
    </div>
  );
}
