"use client";
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth } from 'date-fns';
import ReservationSidebar from '@/components/reservation/ReservationSidebar';
import { sanitizeHtml } from '@/lib/sanitize';

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
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        
        {category.imageUrl && (
          <div className="w-full aspect-[16/9] rounded-lg overflow-hidden">
            <img 
              src={category.imageUrl} 
              alt={category.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">About This Workshop</h2>
          {(category.longDescription || category.description) ? (
            <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(category.longDescription || category.description || '') }} />
          ) : (
            <p className="text-gray-600">No description available for this workshop.</p>
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
