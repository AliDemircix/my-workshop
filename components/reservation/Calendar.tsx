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
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="grid grid-cols-7 text-xs font-medium text-gray-500 mb-3">
        {weekday.map((w) => (
          <div key={w} className="text-center py-2">
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
                'aspect-square rounded-lg border flex items-center justify-center text-sm font-medium transition-all duration-200',
                inMonth ? '' : 'opacity-40',
                canSelect 
                  ? 'border-gray-200 hover:border-orange-400 hover:bg-orange-50 bg-white' 
                  : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed',
                isSelected ? 'bg-orange-500 border-orange-500 text-white shadow-md' : '',
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
