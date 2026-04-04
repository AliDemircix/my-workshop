"use client";
import { addMonths, format } from 'date-fns';
import { nl, tr, enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import Calendar from './Calendar';
import ReserveForm from './ReserveForm';
import { formatEUR } from '@/lib/currency';
import { useTranslations, useLocale } from 'next-intl';

const dateFnsLocales: Record<string, Locale> = { nl, tr, en: enUS };

export default function ReservationSidebar({
  availability,
  viewDate,
  setViewDate,
  selectedDateKey,
  setSelectedDateKey,
  selectedTimeslotId,
  setSelectedTimeslotId,
}: {
  availability: any | null;
  viewDate: Date;
  setViewDate: (fn: (d: Date) => Date) => void;
  selectedDateKey: string | null;
  setSelectedDateKey: (key: string | null) => void;
  selectedTimeslotId: number | null;
  setSelectedTimeslotId: (id: number | null) => void;
}) {
  const t = useTranslations('workshop');
  const locale = useLocale();
  const dfLocale = dateFnsLocales[locale] ?? enUS;

  const dates = availability ? Object.keys(availability) : [];
  const times = selectedDateKey && availability ? availability[selectedDateKey]?.times ?? [] : [];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="block text-sm font-semibold text-gray-900">{t('selectDate')}</span>
          <div className="flex items-center gap-2">
            <button
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm hover:bg-gray-50 transition-colors"
              onClick={() => setViewDate((d) => addMonths(d, -1))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
              {format(viewDate, 'MMM yyyy', { locale: dfLocale })}
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
            {t('noWorkshopsMonth')}
          </p>
        )}
      </div>

      {selectedDateKey && (
        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-900">{t('availableTimes')}</label>
          <div className="space-y-3">
            {times.map((slot: any) => (
              <button
                key={slot.id}
                disabled={slot.remaining <= 0}
                className={`w-full border rounded-lg px-4 py-3 flex items-center justify-between transition-all duration-200 ${
                  selectedTimeslotId === slot.id
                    ? 'bg-[#c99706] border-[#c99706] text-white shadow-md'
                    : slot.remaining <= 0
                    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-gray-300 hover:border-[#c99706] hover:bg-orange-50'
                }`}
                onClick={() => {
                  if (slot.remaining > 0) setSelectedTimeslotId(slot.id);
                }}
              >
                <div className="text-left">
                  <div className="font-medium">
                    {format(new Date(slot.start), 'HH:mm')} - {format(new Date(slot.end), 'HH:mm')}
                  </div>
                  <div className={`text-xs ${selectedTimeslotId === slot.id ? 'text-white/80' : 'text-gray-500'}`}>
                    {slot.remaining > 0 ? t('spotsLeft', { n: slot.remaining }) : t('soldOut')}
                  </div>
                </div>
                <div className="text-right">
                  {slot.remaining > 0 ? (
                    <div className="font-semibold">{formatEUR(slot.priceCents)}</div>
                  ) : (
                    <span className="text-xs font-medium uppercase tracking-wide bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      {t('full')}
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
