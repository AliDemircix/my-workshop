import { formatEUR } from '@/lib/currency';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { hasSmtpConfig, sendMail } from '@/lib/mailer';

export const runtime = 'nodejs';

function getStatusTooltip(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Payment not yet completed or confirmed';
    case 'PAID':
      return 'Payment received and confirmed';
    case 'CANCELED':
      return 'Reservation canceled (no payment was captured)';
    case 'REFUNDING':
      return 'Refund initiated, processing with payment provider';
    case 'REFUNDED':
      return 'Full refund completed and processed';
    default:
      return status;
  }
}

export default async function AdminReservationsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const asStr = (v: unknown) => (Array.isArray(v) ? v[0] : v) as string | undefined;
  const page = Math.max(1, Number(asStr(searchParams?.page)) || 1);
  const allowedPerPage = [10, 20, 50] as const;
  const perPageRaw = Number(asStr(searchParams?.perPage)) || 20;
  const perPage = (allowedPerPage as readonly number[]).includes(perPageRaw) ? perPageRaw : 20;
  const sort = (asStr(searchParams?.sort) || 'newest') as 'newest' | 'oldest' | 'status';
  const status = (asStr(searchParams?.status) || 'all') as 'all' | 'PENDING' | 'PAID' | 'REFUNDING' | 'REFUNDED' | 'CANCELED';
  const categoryId = (() => {
    const v = Number(asStr(searchParams?.categoryId));
    return Number.isFinite(v) && v > 0 ? v : undefined;
  })();
  const q = asStr(searchParams?.q) || '';
  const skip = (page - 1) * perPage;
  async function cancelReservation(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
  const pageOnSubmit = Number(formData.get('page')) || 1;
  const perPageOnSubmit = Number(formData.get('perPage')) || 20;
  const sortOnSubmit = String(formData.get('sort') || 'newest');
  const statusOnSubmit = String(formData.get('status') || 'all');
  const categoryIdOnSubmit = String(formData.get('categoryId') || '');
  const qOnSubmit = String(formData.get('q') || '');
    const r = await prisma.reservation.findUnique({ where: { id } });
    if (!r) return;
    const session = await prisma.session.findUnique({ where: { id: r.sessionId }, include: { category: true } });
    if (r.stripePaymentIntentId) {
      await stripe.refunds.create({ payment_intent: r.stripePaymentIntentId });
      await prisma.reservation.update({ where: { id }, data: { status: 'REFUNDING', canceledAt: new Date() } });
      // Notify user that refund has been initiated
      if (hasSmtpConfig() && r.email) {
        const subject = 'Your refund has been initiated';
        const html = `
          <p>Hi ${r.name},</p>
          <p>Your reservation has been canceled and a refund has been initiated. You should see the funds back in your account within 5-10 business days.</p>
          ${session ? `<p><strong>Workshop:</strong> ${session.category.name}<br/><strong>Date:</strong> ${new Date(session.date).toDateString()}</p>` : ''}
          <p><strong>Participants:</strong> ${r.quantity}</p>
        `;
        sendMail({ to: r.email, subject, html }).catch((e) => console.error('Cancel email failed', e));
      }
    } else {
      await prisma.reservation.update({ where: { id }, data: { status: 'CANCELED', canceledAt: new Date() } });
      // Notify user about cancellation (no payment captured)
      if (hasSmtpConfig() && r.email) {
        const subject = 'Your reservation has been canceled';
        const html = `
          <p>Hi ${r.name},</p>
          <p>Your reservation has been canceled.</p>
          ${session ? `<p><strong>Workshop:</strong> ${session.category.name}<br/><strong>Date:</strong> ${new Date(session.date).toDateString()}</p>` : ''}
          <p><strong>Participants:</strong> ${r.quantity}</p>
        `;
        sendMail({ to: r.email, subject, html }).catch((e) => console.error('Cancel email failed', e));
      }
    }
  revalidatePath('/admin/reservations');
  const p = new URLSearchParams();
  p.set('page', String(pageOnSubmit));
  if (perPageOnSubmit) p.set('perPage', String(perPageOnSubmit));
  if (sortOnSubmit) p.set('sort', sortOnSubmit);
  if (statusOnSubmit && statusOnSubmit !== 'all') p.set('status', statusOnSubmit);
  if (categoryIdOnSubmit) p.set('categoryId', categoryIdOnSubmit);
  if (qOnSubmit) p.set('q', qOnSubmit);
  redirect(`/admin/reservations?${p.toString()}`);
  }

  const orderBy =
    sort === 'oldest'
      ? { createdAt: 'asc' as const }
      : sort === 'status'
      ? [{ status: 'asc' as const }, { createdAt: 'desc' as const }]
      : { createdAt: 'desc' as const };

  const where: any = {
    ...(status !== 'all' ? { status } : {}),
    ...(categoryId ? { session: { categoryId } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {}),
  };

  const [reservations, total, categories] = await Promise.all([
    prisma.reservation.findMany({
      include: { session: { include: { category: true } } },
      orderBy: orderBy as any,
      where,
      skip,
      take: perPage,
    }),
    prisma.reservation.count({ where }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const qsBase = (() => {
    const p = new URLSearchParams();
    p.set('perPage', String(perPage));
    p.set('sort', sort);
    if (status !== 'all') p.set('status', status);
    if (categoryId) p.set('categoryId', String(categoryId));
    if (q) p.set('q', q);
    return p.toString();
  })();

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
        <p className="text-gray-600 mt-1">Manage workshop reservations and process refunds</p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Total reservations: <span className="font-semibold">{total}</span>
        </div>
        <form method="get" className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-1">
            <span>Search:</span>
            <input type="text" name="q" defaultValue={q} placeholder="name or email" className="border rounded px-2 py-1" />
          </label>
          <label className="flex items-center gap-1">
            <span>Status:</span>
            <select name="status" defaultValue={status} className="border rounded px-2 py-1">
              <option value="all">All</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="REFUNDING">Refunding</option>
              <option value="REFUNDED">Refunded</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </label>
          <label className="flex items-center gap-1">
            <span>Category:</span>
            <select name="categoryId" defaultValue={String(categoryId || '')} className="border rounded px-2 py-1">
              <option value="">All</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            <span>Rows:</span>
            <select name="perPage" defaultValue={String(perPage)} className="border rounded px-2 py-1">
              {[10,20,50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            <span>Sort:</span>
            <select name="sort" defaultValue={sort} className="border rounded px-2 py-1">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="status">Status A→Z</option>
            </select>
          </label>
          <input type="hidden" name="page" value={1} />
          <button className="border rounded px-3 py-1 hover:bg-gray-50" type="submit">Apply</button>
          <a className="underline text-gray-600 hover:text-black" href="/admin/reservations">Reset</a>
        </form>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-md overflow-hidden">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm">
              <th className="px-3 py-2 border-b">#</th>
              <th className="px-3 py-2 border-b">Name</th>
              <th className="px-3 py-2 border-b">Email</th>
              <th className="px-3 py-2 border-b">Category</th>
              <th className="px-3 py-2 border-b">Date</th>
              <th className="px-3 py-2 border-b">Qty</th>
              <th className="px-3 py-2 border-b">Status</th>
              <th className="px-3 py-2 border-b">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reservations.map((r: any) => (
              <tr key={r.id} className="text-sm hover:bg-gray-50">
                <td className="px-3 py-2">{r.id}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.session.category.name}</td>
                <td className="px-3 py-2">{new Date(r.session.date).toDateString()}</td>
                <td className="px-3 py-2">{r.quantity}</td>
                <td className="px-3 py-2">
                  <span 
                    className="cursor-help" 
                    title={getStatusTooltip(r.status)}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <form action={cancelReservation}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="page" value={page} />
                    <input type="hidden" name="perPage" value={perPage} />
                    <input type="hidden" name="sort" value={sort} />
                    <input type="hidden" name="status" value={status} />
                    <input type="hidden" name="categoryId" value={categoryId || ''} />
                    <input type="hidden" name="q" value={q} />
                    <button className="text-red-600 underline" disabled={r.status === 'REFUNDED' || r.status === 'CANCELED'}>Cancel & Refund</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3 text-sm">
        <div>
          Showing {skip + 1}–{Math.min(skip + perPage, total)} of {total}
        </div>
        <div className="flex items-center gap-2">
          <a
            className={`px-3 py-1.5 border rounded ${page <= 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'}`}
            href={`/admin/reservations?page=${page - 1}&${qsBase}`}
            aria-disabled={page <= 1}
          >
            Previous
          </a>
          <span>
            Page {page} / {totalPages}
          </span>
          <a
            className={`px-3 py-1.5 border rounded ${page >= totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'}`}
            href={`/admin/reservations?page=${page + 1}&${qsBase}`}
            aria-disabled={page >= totalPages}
          >
            Next
          </a>
          <form method="get" className="ml-2 flex items-center gap-1">
            <input type="hidden" name="perPage" value={perPage} />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="categoryId" value={categoryId || ''} />
            <input type="hidden" name="q" value={q} />
            <label className="flex items-center gap-1">
              <span>Go to:</span>
              <input type="number" name="page" min={1} max={totalPages} defaultValue={page} className="w-20 border rounded px-2 py-1" />
            </label>
            <button className="border rounded px-2 py-1 hover:bg-gray-50" type="submit">Go</button>
          </form>
        </div>
      </div>
    </div>
  );
}
