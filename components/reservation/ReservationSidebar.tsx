"use client";
import { addMonths, format } from 'date-fns';
import { useMemo, useState } from 'react';
import Calendar from './Calendar';
import ReserveForm from './ReserveForm';
import { formatEUR } from '@/lib/currency';

export default function ReservationSidebar({
  availability,
  viewDate,
  setViewDate,
}: {
  availability: any | null;
  viewDate: Date;
  setViewDate: (d: (d: Date) => Date) => void;
}) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedTimeslotId, setSelectedTimeslotId] = useState<number | null>(null);

  const dates = useMemo(() => (availability ? Object.keys(availability) : []), [availability]);
  const times = selectedDateKey && availability ? availability[selectedDateKey]?.times ?? [] : [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="block text-sm font-medium">Pick a date</span>
        <div className="flex items-center gap-2">
          <button
            className="border rounded px-2 py-1 text-sm"
            onClick={() => setViewDate((d) => addMonths(d, -1))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <div className="text-sm font-medium">{format(viewDate, 'MMM yyyy')}</div>
          <button
            className="border rounded px-2 py-1 text-sm"
            onClick={() => setViewDate((d) => addMonths(d, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <Calendar
        monthDate={viewDate}
        availabilityKeys={dates}
        selectedKey={selectedDateKey}
        onSelect={(k) => {
          setSelectedDateKey(k);
          setSelectedTimeslotId(null);
        }}
      />
      {dates.length === 0 && <p className="text-xs text-gray-500">No availability this month</p>}

      {selectedDateKey && (
        <div className="pt-2">
          <label className="block text-sm font-medium mb-2">Timeslots</label>
          <div className="space-y-2">
            {times.map((t: any) => (
              <button
                key={t.id}
                disabled={t.remaining <= 0}
                className={`w-full border rounded px-3 py-2 flex items-center justify-between ${
                  selectedTimeslotId === t.id ? 'bg-[#c99706] text-white' : ''
                } ${t.remaining <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (t.remaining > 0) setSelectedTimeslotId(t.id);
                }}
              >
                <span>
                  {format(new Date(t.start), 'HH:mm')} - {format(new Date(t.end), 'HH:mm')}
                  <span className={`ml-2 text-xs ${selectedTimeslotId === t.id ? 'text-white' : 'text-gray-500'}`}>
                    {t.remaining} spots left
                  </span>
                </span>
                {t.remaining > 0 ? (
                  <span>{formatEUR(t.priceCents)}</span>
                ) : (
                  <span className="text-xs font-medium uppercase tracking-wide bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    Sold out
                  </span>
                )}
              </button>
            ))}
          </div>
          {selectedTimeslotId && (() => {
            const sel = times.find((x: any) => x.id === selectedTimeslotId);
            const remaining = sel?.remaining ?? 0;
            return (
              <div className="mt-4">
                <ReserveForm sessionId={selectedTimeslotId} remaining={remaining} />
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
