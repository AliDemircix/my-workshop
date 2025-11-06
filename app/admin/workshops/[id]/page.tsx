import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';

function toInputDate(d: Date) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toInputTime(d: Date) {
  return format(new Date(d), 'HH:mm');
}

export default async function EditWorkshopPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return notFound();

  const [session, categories] = await Promise.all([
    prisma.session.findUnique({ where: { id }, include: { category: true } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);
  if (!session) return notFound();

  async function updateSession(formData: FormData) {
    'use server';
    const categoryId = Number(formData.get('categoryId'));
    const dateStr = String(formData.get('date') || ''); // yyyy-MM-dd
    const startStr = String(formData.get('startTime') || ''); // HH:mm
    const endStr = String(formData.get('endTime') || ''); // HH:mm
    const capacity = Number(formData.get('capacity'));
    const priceCents = Math.round(Number(formData.get('price')) * 100);

    if (!categoryId || !dateStr || !startStr || !endStr) return;

    const date = new Date(`${dateStr}T00:00:00`);
    const start = new Date(`${dateStr}T${startStr}:00`);
    const end = new Date(`${dateStr}T${endStr}:00`);
    if (isNaN(date.valueOf()) || isNaN(start.valueOf()) || isNaN(end.valueOf())) return;
    if (end <= start) return;

    await prisma.session.update({
      where: { id },
      data: { categoryId, date, startTime: start, endTime: end, capacity, priceCents },
    });
    revalidatePath('/admin/workshops');
    redirect('/admin/workshops');
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Edit Workshop Session</h2>
      <form action={updateSession} className="grid grid-cols-1 md:grid-cols-3 gap-3 border rounded p-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Category</label>
          <select name="categoryId" className="border rounded px-2 py-2" defaultValue={session.categoryId}>
            {categories.map((c: { id: number; name: string }) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Date</label>
          <input name="date" className="border rounded px-2 py-2" type="date" defaultValue={toInputDate(session.date)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Start time</label>
          <input name="startTime" className="border rounded px-2 py-2" type="time" defaultValue={toInputTime(session.startTime)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">End time</label>
          <input name="endTime" className="border rounded px-2 py-2" type="time" defaultValue={toInputTime(session.endTime)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Capacity</label>
          <input name="capacity" className="border rounded px-2 py-2" type="number" min="1" defaultValue={session.capacity} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Price (EUR)</label>
          <input name="price" className="border rounded px-2 py-2" type="number" step="0.01" defaultValue={(session.priceCents / 100).toFixed(2)} />
        </div>
        <div className="md:col-span-3 flex gap-2">
          <button className="bg-gray-900 text-white rounded px-4 py-2">Save</button>
          <a href="/admin/workshops" className="underline">Cancel</a>
        </div>
      </form>
    </div>
  );
}
