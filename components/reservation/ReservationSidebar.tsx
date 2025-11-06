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
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="block text-sm font-semibold text-gray-900">Select Date</span>
          <div className="flex items-center gap-2">
            <button
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm hover:bg-gray-50 transition-colors"
              onClick={() => setViewDate((d) => addMonths(d, -1))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
              {format(viewDate, 'MMM yyyy')}
            </div>
            <button
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm hover:bg-gray-50 transition-colors"
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
        {dates.length === 0 && (
          <p className="text-xs text-gray-500 text-center mt-3 bg-gray-50 rounded-lg py-3">
            No workshops available this month
          </p>
        )}
      </div>

      {selectedDateKey && (
        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-900">Available Times</label>
          <div className="space-y-3">
            {times.map((t: any) => (
              <button
                key={t.id}
                disabled={t.remaining <= 0}
                className={`w-full border rounded-lg px-4 py-3 flex items-center justify-between transition-all duration-200 ${
                  selectedTimeslotId === t.id 
                    ? 'bg-[#c99706] border-[#c99706] text-white shadow-md' 
                    : t.remaining <= 0 
                    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-white border-gray-300 hover:border-[#c99706] hover:bg-orange-50'
                }`}
                onClick={() => {
                  if (t.remaining > 0) setSelectedTimeslotId(t.id);
                }}
              >
                <div className="text-left">
                  <div className="font-medium">
                    {format(new Date(t.start), 'HH:mm')} - {format(new Date(t.end), 'HH:mm')}
                  </div>
                  <div className={`text-xs ${selectedTimeslotId === t.id ? 'text-white/80' : 'text-gray-500'}`}>
                    {t.remaining > 0 ? `${t.remaining} spots left` : 'Sold out'}
                  </div>
                </div>
                <div className="text-right">
                  {t.remaining > 0 ? (
                    <div className="font-semibold">{formatEUR(t.priceCents)}</div>
                  ) : (
                    <span className="text-xs font-medium uppercase tracking-wide bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      Full
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {selectedTimeslotId && (() => {
            const sel = times.find((x: any) => x.id === selectedTimeslotId);
            const remaining = sel?.remaining ?? 0;
            return (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <ReserveForm sessionId={selectedTimeslotId} remaining={remaining} />
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
