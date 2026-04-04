"use client";
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek, isAfter, isSameDay, startOfDay } from 'date-fns';
import { nl, tr, enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { useLocale } from 'next-intl';

const dateFnsLocales: Record<string, Locale> = { nl, tr, en: enUS };

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
  const locale = useLocale();
  const dfLocale = dateFnsLocales[locale] ?? enUS;

  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  // Generate locale-aware weekday headers (Mon–Sun) from a known Monday
  const refMonday = startOfWeek(new Date(2024, 0, 1), { weekStartsOn: 1 });
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(refMonday, i), 'EEE', { locale: dfLocale })
  );

  const has = new Set(availabilityKeys);
  const toKey = (d: Date) => format(d, 'yyyy-MM-dd');
  const today = startOfDay(new Date());

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="grid grid-cols-7 text-xs font-medium text-gray-500 mb-3">
        {weekdays.map((w) => (
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
              aria-label={`${format(d, 'MMMM d', { locale: dfLocale })}${isSelected ? ', selected' : available && !isPastDate ? ', available' : ''}`}
              aria-pressed={isSelected}
              className={[
                'aspect-square rounded-lg border flex items-center justify-center text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1',
                inMonth ? '' : 'opacity-40',
                canSelect && !isSelected
                  ? 'border-orange-400 text-orange-600 hover:bg-orange-50 bg-white'
                  : !isSelected ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed' : '',
                isSelected ? 'bg-[#c99706] border-[#c99706] text-white font-bold shadow-md' : '',
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
