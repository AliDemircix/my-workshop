import { formatEUR } from '@/lib/currency';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';
import DeleteSessionButton from '@/components/admin/DeleteSessionButton';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import WorkshopsToast from '@/components/admin/WorkshopsToast';
import AddWorkshopDialog from '@/components/admin/AddWorkshopDialog';

export default async function WorkshopsPage({ searchParams }: { searchParams?: { error?: string; page?: string } }) {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  const pageSize = 10;
  const currentPage = Math.max(1, Number(searchParams?.page || 1));

  async function createSession(formData: FormData) {
    'use server';
    const categoryId = Number(formData.get('categoryId'));
    const dateStr = String(formData.get('date') || '').trim(); // yyyy-MM-dd
    const startStr = String(formData.get('startTime') || '').trim(); // HH:mm
    const endStr = String(formData.get('endTime') || '').trim(); // HH:mm
    const capacity = Number(formData.get('capacity'));
    const price = Number(formData.get('price'));
    const priceCents = Math.round(price * 100);

    if (!categoryId || !dateStr || !startStr || !endStr || !capacity || !price) {
      return redirect('/admin/workshops?error=Please%20fill%20all%20fields');
    }

    if (capacity < 1 || price <= 0) {
      return redirect('/admin/workshops?error=Capacity%20and%20price%20must%20be%20positive');
    }

    const date = new Date(`${dateStr}T00:00:00`);
    const start = new Date(`${dateStr}T${startStr}:00`);
    const end = new Date(`${dateStr}T${endStr}:00`);
    if (isNaN(date.valueOf()) || isNaN(start.valueOf()) || isNaN(end.valueOf())) {
      return redirect('/admin/workshops?error=Invalid%20date%20or%20time');
    }
    // Prevent creating workshops in the past (compare by date only)
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (date < todayMidnight) {
      return redirect('/admin/workshops?error=Date%20cannot%20be%20in%20the%20past');
    }
    if (end <= start) {
      return redirect('/admin/workshops?error=End%20time%20must%20be%20after%20start%20time');
    }

  await prisma.session.create({ data: { categoryId, date, startTime: start, endTime: end, capacity, priceCents } });
  revalidatePath('/admin/workshops');
  redirect('/admin/workshops?added=1');
  }

  async function deleteSession(formData: FormData) {
    'use server';
    const id = Number(formData.get('id'));
    const page = Number(formData.get('page') || 1);
    if (!id) {
      redirect(`/admin/workshops?error=Invalid%20session&page=${page}`);
    }
    const count = await prisma.reservation.count({ where: { sessionId: id } });
    if (count > 0) {
      redirect(`/admin/workshops?error=Cannot%20delete%20a%20session%20with%20reservations&page=${page}`);
    }
    await prisma.session.delete({ where: { id } });
    revalidatePath('/admin/workshops');
    redirect(`/admin/workshops?page=${page}`);
  }

  const totalCount = await prisma.session.count();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(currentPage, totalPages);
  const skip = (page - 1) * pageSize;

  const sessions = await prisma.session.findMany({
    include: {
      category: true,
      _count: { select: { reservations: true } },
      reservations: { select: { quantity: true, status: true } },
    },
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    skip,
    take: pageSize,
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Workshops</h1>
        <p className="text-gray-600 mt-1">Manage workshop sessions, schedules, and availability</p>
      </div>
      
      <WorkshopsToast />
      {searchParams?.error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Total sessions: <span className="font-semibold">{totalCount}</span>
        </div>
        <AddWorkshopDialog action={createSession} categories={categories} />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-md overflow-hidden">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm">
              <th className="px-3 py-2 border-b">Category</th>
              <th className="px-3 py-2 border-b">Date</th>
              <th className="px-3 py-2 border-b">Time</th>
              <th className="px-3 py-2 border-b">Capacity</th>
              <th className="px-3 py-2 border-b">Price</th>
              <th className="px-3 py-2 border-b">Status</th>
              <th className="px-3 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sessions.map((s: { id: number; date: Date; startTime: Date; endTime: Date; capacity: number; priceCents: number; category: { name: string }; _count?: { reservations: number }; reservations?: { quantity: number; status: string }[] }) => (
              <tr
                key={s.id}
                className={`text-sm hover:bg-gray-50 ${new Date(s.endTime) < new Date() ? 'bg-gray-100' : ''}`}
              >
                <td className="px-3 py-2">
                  <Link href={`/admin/workshops/${s.id}/details`} className="text-blue-600 hover:text-blue-800 underline">
                    {s.category.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{new Date(s.date).toDateString()}</td>
                <td className="px-3 py-2">{format(new Date(s.startTime), 'HH:mm')}–{format(new Date(s.endTime), 'HH:mm')}</td>
                <td className="px-3 py-2">
                  {(() => {
                    const reservedSeats = (s.reservations || []).reduce((sum, r) => (r.status !== 'CANCELED' && r.status !== 'REFUNDED' ? sum + r.quantity : sum), 0);
                    return `${reservedSeats}/${s.capacity}`;
                  })()}
                </td>
                <td className="px-3 py-2">{formatEUR(s.priceCents)}</td>
                <td className="px-3 py-2">
                  {(() => {
                    const now = new Date();
                    const end = new Date(s.endTime);
                    const reservedSeats = (s.reservations || []).reduce((sum, r) => (r.status !== 'CANCELED' && r.status !== 'REFUNDED' ? sum + r.quantity : sum), 0);
                    const isFinished = end < now;
                    const isFull = reservedSeats >= s.capacity;
                    const label = isFinished ? 'Finished' : isFull ? 'Ready' : 'In progress';
                    const cls = isFinished
                      ? 'bg-gray-200 text-gray-800'
                      : isFull
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800';
                    return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
                  })()}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {new Date(s.endTime) < new Date() ? (
                      <span
                        className="inline-flex items-center gap-1 opacity-50 cursor-not-allowed text-gray-400"
                        title="Cannot edit a finished workshop"
                        aria-disabled="true"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M5.433 13.917l-1.354.339a.75.75 0 01-.904-.904l.339-1.354a2.25 2.25 0 01.592-1.09l6.82-6.82a2.25 2.25 0 113.182 3.182l-6.82 6.82a2.25 2.25 0 01-1.09.592z" />
                          <path d="M3.25 15.25h13.5a.75.75 0 010 1.5H3.25a.75.75 0 010-1.5z" />
                        </svg>
                        <span className="sr-only">Edit</span>
                      </span>
                    ) : (
                      <Link
                        href={`/admin/workshops/${s.id}`}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        title="Edit session"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M5.433 13.917l-1.354.339a.75.75 0 01-.904-.904l.339-1.354a2.25 2.25 0 01.592-1.09l6.82-6.82a2.25 2.25 0 113.182 3.182l-6.82 6.82a2.25 2.25 0 01-1.09.592z" />
                          <path d="M3.25 15.25h13.5a.75.75 0 010 1.5H3.25a.75.75 0 010-1.5z" />
                        </svg>
                        <span className="sr-only">Edit</span>
                      </Link>
                    )}
                    {(() => {
                      const finished = new Date(s.endTime) < new Date();
                      const hasRes = (s._count?.reservations || 0) > 0;
                      const title = finished
                        ? 'Cannot delete a finished workshop'
                        : hasRes
                        ? 'Cannot delete session with reservations'
                        : 'Delete session';
                      return (
                        <DeleteSessionButton
                          id={s.id}
                          action={deleteSession}
                          disabled={finished || hasRes}
                          title={title}
                          page={page}
                        />
                      );
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Showing {totalCount === 0 ? 0 : skip + 1}–{Math.min(skip + sessions.length, totalCount)} of {totalCount}
        </div>
        <div className="flex items-center gap-1">
          <PaginationLink href={`/admin/workshops?page=${Math.max(1, page - 1)}` } disabled={page <= 1}>
            Previous
          </PaginationLink>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const p = idx + 1;
            return (
              <PaginationLink key={p} href={`/admin/workshops?page=${p}`} active={p === page}>
                {p}
              </PaginationLink>
            );
          })}
          <PaginationLink href={`/admin/workshops?page=${Math.min(totalPages, page + 1)}` } disabled={page >= totalPages}>
            Next
          </PaginationLink>
        </div>
      </div>
    </div>
  );
}

function PaginationLink({ href, children, disabled, active }: { href: string; children: React.ReactNode; disabled?: boolean; active?: boolean }) {
  const className = [
    'px-3 py-1 rounded border text-sm',
    active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50',
    disabled ? 'opacity-50 cursor-not-allowed hover:bg-white' : '',
  ].join(' ').trim();
  if (disabled) return <span className={className}>{children}</span>;
  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}
