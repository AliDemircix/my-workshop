import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import WorkshopsToast from '@/components/admin/WorkshopsToast';
import { requireAdminAction } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import WorkshopsClientShell from '@/components/admin/WorkshopsClientShell';

export default async function WorkshopsPage({ searchParams }: { searchParams?: { error?: string; page?: string; categoryId?: string } }) {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  const pageSize = 10;
  const currentPage = Math.max(1, Number(searchParams?.page || 1));
  const activeCategoryId = searchParams?.categoryId ? Number(searchParams.categoryId) : (categories[0]?.id ?? undefined);
  const categoryFilter = activeCategoryId ? { categoryId: activeCategoryId } : undefined;

  async function createSession(formData: FormData) {
    'use server';
    requireAdminAction();
    const categoryId = Number(formData.get('categoryId'));
    const datesRaw = String(formData.get('dates') || '').trim(); // comma-separated yyyy-MM-dd
    const startStr = String(formData.get('startTime') || '').trim(); // HH:mm
    const endStr = String(formData.get('endTime') || '').trim(); // HH:mm
    const capacity = Number(formData.get('capacity'));
    const price = Number(formData.get('price'));
    const priceCents = Math.round(price * 100);

    if (!categoryId || !datesRaw || !startStr || !endStr || !capacity || !price) {
      return redirect('/admin/workshops?error=Please%20fill%20all%20fields');
    }

    const dateStrings = datesRaw
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    if (dateStrings.length === 0) {
      return redirect('/admin/workshops?error=Please%20select%20at%20least%20one%20date');
    }

    if (capacity < 1 || price <= 0) {
      return redirect('/admin/workshops?error=Capacity%20and%20price%20must%20be%20positive');
    }

    // Validate end > start using an arbitrary date — times are the same for all sessions
    const referenceStart = new Date(`${dateStrings[0]}T${startStr}:00`);
    const referenceEnd = new Date(`${dateStrings[0]}T${endStr}:00`);
    if (isNaN(referenceStart.valueOf()) || isNaN(referenceEnd.valueOf())) {
      return redirect('/admin/workshops?error=Invalid%20time%20values');
    }
    if (referenceEnd <= referenceStart) {
      return redirect('/admin/workshops?error=End%20time%20must%20be%20after%20start%20time');
    }

    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Validate every date before writing anything
    for (const dateStr of dateStrings) {
      const date = new Date(`${dateStr}T00:00:00`);
      if (isNaN(date.valueOf())) {
        return redirect('/admin/workshops?error=Invalid%20date%20format');
      }
      if (date < todayMidnight) {
        return redirect('/admin/workshops?error=Date%20cannot%20be%20in%20the%20past');
      }
    }

    // Check for time conflicts on each date before writing anything
    for (const dateStr of dateStrings) {
      const date = new Date(`${dateStr}T00:00:00`);
      const start = new Date(`${dateStr}T${startStr}:00`);
      const end = new Date(`${dateStr}T${endStr}:00`);
      const conflict = await prisma.session.findFirst({
        where: {
          date,
          startTime: { lt: end },
          endTime: { gt: start },
        },
        include: { category: true },
      });
      if (conflict) {
        const conflictStart = conflict.startTime.toTimeString().slice(0, 5);
        const conflictEnd = conflict.endTime.toTimeString().slice(0, 5);
        return redirect(
          `/admin/workshops?categoryId=${categoryId}&error=${encodeURIComponent(
            `${dateStr} conflicts with "${conflict.category.name}" (${conflictStart}–${conflictEnd})`
          )}`
        );
      }
    }

    // Create one session per selected date
    for (const dateStr of dateStrings) {
      const date = new Date(`${dateStr}T00:00:00`);
      const start = new Date(`${dateStr}T${startStr}:00`);
      const end = new Date(`${dateStr}T${endStr}:00`);
      await prisma.session.create({
        data: { categoryId, date, startTime: start, endTime: end, capacity, priceCents },
      });
    }

    revalidatePath('/admin/workshops');
    redirect(`/admin/workshops?categoryId=${categoryId}&added=1`);
  }

  async function deleteSession(formData: FormData) {
    'use server';
    requireAdminAction();
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
    logAction('SESSION_DELETED', 'Session', String(id));
    revalidatePath('/admin/workshops');
    redirect(`/admin/workshops?page=${page}`);
  }

  const totalCount = await prisma.session.count({ where: categoryFilter });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(currentPage, totalPages);
  const skip = (page - 1) * pageSize;

  const sessions = await prisma.session.findMany({
    where: categoryFilter,
    include: {
      category: true,
      _count: { select: { reservations: true } },
      reservations: { select: { quantity: true, status: true } },
    },
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    skip,
    take: pageSize,
  });

  // Serialize Date fields to strings for the Client Component
  const serializedSessions = sessions.map((s) => ({
    id: s.id,
    categoryId: s.categoryId,
    date: s.date.toISOString(),
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    capacity: s.capacity,
    priceCents: s.priceCents,
    category: s.category,
    _count: s._count,
    reservations: s.reservations,
  }));

  return (
    <div className="space-y-6">
      <WorkshopsClientShell
        sessions={serializedSessions}
        categories={categories}
        totalCount={totalCount}
        action={createSession}
        deleteAction={deleteSession}
        defaultCategoryId={activeCategoryId}
        page={page}
      />

      <WorkshopsToast />
      {searchParams?.error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex gap-1 border-b border-gray-200">
          {categories.map((cat) => {
            const isActive = cat.id === activeCategoryId;
            return (
              <Link
                key={cat.id}
                href={`/admin/workshops?categoryId=${cat.id}&page=1`}
                className={[
                  'px-4 py-2 text-sm rounded-t',
                  isActive
                    ? 'font-semibold bg-white border-b-2 border-[#c99706] -mb-px text-[#c99706]'
                    : 'text-gray-600 hover:bg-gray-50 border-b-2 border-transparent',
                ].join(' ')}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Showing {totalCount === 0 ? 0 : skip + 1}–{Math.min(skip + sessions.length, totalCount)} of {totalCount}
        </div>
        <div className="flex items-center gap-1">
          <PaginationLink href={`/admin/workshops?categoryId=${activeCategoryId}&page=${Math.max(1, page - 1)}`} disabled={page <= 1}>
            Previous
          </PaginationLink>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const p = idx + 1;
            return (
              <PaginationLink key={p} href={`/admin/workshops?categoryId=${activeCategoryId}&page=${p}`} active={p === page}>
                {p}
              </PaginationLink>
            );
          })}
          <PaginationLink href={`/admin/workshops?categoryId=${activeCategoryId}&page=${Math.min(totalPages, page + 1)}`} disabled={page >= totalPages}>
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
