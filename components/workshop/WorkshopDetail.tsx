"use client";
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth } from 'date-fns';
import ReservationSidebar from '@/components/reservation/ReservationSidebar';

type Category = {
  id: number;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
  longDescription?: string | null;
};

export default function WorkshopDetail({ category }: { category: Category }) {
  const categoryId = category.id;
  const [viewDate, setViewDate] = useState<Date>(startOfMonth(new Date()))
  const { data: availability } = useQuery<any>({
    queryKey: ['availability', categoryId, viewDate.getMonth(), viewDate.getFullYear()],
    queryFn: async () => (await fetch(`/api/availability?categoryId=${categoryId}&month=${viewDate.getMonth()}&year=${viewDate.getFullYear()}`)).json(),
  });

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Image + rich description (2/3 width) */}
        <div className="md:col-span-2 space-y-6">
          <div className="w-full aspect-[16/9] rounded border bg-gray-100 flex items-center justify-center overflow-hidden">
            {category.imageUrl ? (
              <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-500">Workshop image</div>
            )}
          </div>
          {(category.longDescription || category.description) && (
            <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: category.longDescription || category.description || '' }} />
          )}
        </div>

        {/* Right: Calendar & reservation */}
        <aside className="md:col-span-1 space-y-4">
          <ReservationSidebar availability={availability} viewDate={viewDate} setViewDate={(fn) => setViewDate(fn)} />
        </aside>
      </div>
    </div>
  );
}
