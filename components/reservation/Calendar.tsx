"use client";
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfDay, startOfMonth, startOfWeek, isAfter, isSameDay } from 'date-fns';

export default function Calendar({
  monthDate,
  availabilityKeys,
  selectedKey,
  onSelect,
}: {
  monthDate: Date;
  availabilityKeys: string[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const has = new Set(availabilityKeys);
  const toKey = (d: Date) => startOfDay(d).toISOString();
  const weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = startOfDay(new Date());

  return (
    <div className="border rounded p-3">
      <div className="grid grid-cols-7 text-xs text-gray-500 mb-2">
        {weekday.map((w) => (
          <div key={w} className="text-center py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = toKey(d);
          const inMonth = isSameMonth(d, monthDate);
          const available = has.has(key);
          const isSelected = selectedKey === key;
          const isPastDate = !isAfter(d, today) && !isSameDay(d, today);
          const canSelect = available && !isPastDate;
          
          return (
            <button
              key={key}
              disabled={!canSelect}
              onClick={() => canSelect && onSelect(key)}
              className={[
                'aspect-square rounded border flex items-center justify-center text-sm',
                inMonth ? '' : 'opacity-40',
                canSelect ? 'hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                isSelected ? 'bg-[#c99706] text-white' : '',
                isPastDate ? 'opacity-50 line-through' : '',
              ].join(' ')}
            >
              {format(d, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
