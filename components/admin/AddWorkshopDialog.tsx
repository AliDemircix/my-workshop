"use client";
import { useEffect, useRef, useState } from 'react';

// ─── Calendar helpers ────────────────────────────────────────────────────────

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** 0 = Monday … 6 = Sunday (ISO week order) */
function getFirstDayOfWeek(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  return jsDay === 0 ? 6 : jsDay - 1;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Inline multi-date calendar ──────────────────────────────────────────────

function MultiDateCalendar({
  minDate,
  selectedDates,
  onToggle,
}: {
  minDate: string;
  selectedDates: string[];
  onToggle: (key: string) => void;
}) {
  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth());

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth); // 0-based Mon

  // Build a flat array of cells: null for leading blanks, day number for real days
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedSet = new Set(selectedDates);

  return (
    <div className="border rounded p-2 select-none">
      {/* Month / year navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Previous month"
          className="p-1 rounded hover:bg-gray-100 text-gray-600"
        >
          &#8249;
        </button>
        <span className="text-sm font-semibold">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Next month"
          className="p-1 rounded hover:bg-gray-100 text-gray-600"
        >
          &#8250;
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} />;
          }

          const key = toDateKey(viewYear, viewMonth, day);
          const isPast = key < minDate;
          const isToday = key === todayKey;
          const isSelected = selectedSet.has(key);

          let cellClass =
            'relative flex items-center justify-center h-8 w-full rounded text-xs cursor-pointer transition-colors';

          if (isPast) {
            cellClass += ' text-gray-300 cursor-not-allowed';
          } else if (isSelected) {
            cellClass += ' bg-[#c99706] text-white font-semibold';
          } else {
            cellClass += ' text-gray-700 hover:bg-amber-50';
          }

          return (
            <button
              key={key}
              type="button"
              disabled={isPast}
              onClick={() => !isPast && onToggle(key)}
              aria-label={key}
              aria-pressed={isSelected}
              className={cellClass}
            >
              {day}
              {/* Today indicator dot — only when not selected */}
              {isToday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#c99706]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main dialog ─────────────────────────────────────────────────────────────

export default function AddWorkshopDialog({
  action,
  categories,
  defaultCategoryId,
}: {
  action: (formData: FormData) => void;
  categories: { id: number; name: string }[];
  defaultCategoryId?: number;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [minDate, setMinDate] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
    defaultCategoryId ?? categories[0]?.id,
  );
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    setSelectedCategoryId(defaultCategoryId ?? categories[0]?.id);
  }, [defaultCategoryId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setMinDate(`${y}-${m}-${day}`);
  }, []);

  function handleToggleDate(key: string) {
    setSelectedDates((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key],
    );
    setDateError('');
  }

  function handleOpenDialog() {
    setSelectedDates([]);
    setDateError('');
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (selectedDates.length === 0) {
      e.preventDefault();
      setDateError('Please select at least one date.');
      return;
    }
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenDialog}
        className="bg-gray-900 text-white rounded px-4 py-2"
      >
        Add Workshop
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
          aria-modal
          role="dialog"
        >
          <div
            ref={dialogRef}
            className="w-full max-w-2xl rounded bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Add Workshop</h3>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-800"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form
              action={action}
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              {/* Category */}
              <div className="flex flex-col gap-1 md:col-span-3">
                <label className="text-sm font-medium">Category</label>
                <select
                  name="categoryId"
                  className="border rounded px-2 py-2"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-date calendar */}
              <div className="flex flex-col gap-1 md:col-span-3">
                <label className="text-sm font-medium">Dates</label>
                {minDate && (
                  <MultiDateCalendar
                    minDate={minDate}
                    selectedDates={selectedDates}
                    onToggle={handleToggleDate}
                  />
                )}
                {/* Hidden field carries all selected dates to the server action */}
                <input
                  type="hidden"
                  name="dates"
                  value={selectedDates.join(',')}
                />
                <p className="text-xs text-gray-500">
                  {selectedDates.length > 0
                    ? `${selectedDates.length} date${selectedDates.length === 1 ? '' : 's'} selected`
                    : 'No dates selected'}
                </p>
                {dateError && (
                  <p className="text-xs text-red-600" role="alert">
                    {dateError}
                  </p>
                )}
              </div>

              {/* Start time */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Start time</label>
                <input
                  name="startTime"
                  className="border rounded px-2 py-2"
                  type="time"
                  defaultValue="13:00"
                  required
                />
              </div>

              {/* End time */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">End time</label>
                <input
                  name="endTime"
                  className="border rounded px-2 py-2"
                  type="time"
                  defaultValue="15:00"
                  required
                />
              </div>

              {/* Capacity */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Capacity</label>
                <input
                  name="capacity"
                  className="border rounded px-2 py-2"
                  type="number"
                  min="1"
                  placeholder="Seats"
                  defaultValue="6"
                  required
                />
              </div>

              {/* Price */}
              <div className="flex flex-col gap-1 md:col-span-3">
                <label className="text-sm font-medium">Price (EUR)</label>
                <input
                  name="price"
                  className="border rounded px-2 py-2"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 50"
                  defaultValue="50"
                  required
                />
              </div>

              {/* Actions */}
              <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded border"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button className="bg-gray-900 text-white rounded px-4 py-2">
                  Add Workshop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
