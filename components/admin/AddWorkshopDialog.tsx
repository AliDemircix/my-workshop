"use client";
import { useEffect, useRef, useState } from 'react';

export default function AddWorkshopDialog({
  action,
  categories,
}: {
  action: (formData: FormData) => void;
  categories: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [minDate, setMinDate] = useState('');

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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

            <form action={action} onSubmit={() => setOpen(false)} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1 md:col-span-3">
                <label className="text-sm font-medium">Category</label>
                <select name="categoryId" className="border rounded px-2 py-2" required>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Date</label>
                <input name="date" className="border rounded px-2 py-2" type="date" required min={minDate} />
                <p className="text-xs text-gray-500">Select the day of the workshop</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Start time</label>
                <input name="startTime" className="border rounded px-2 py-2" type="time" defaultValue="12:00" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">End time</label>
                <input name="endTime" className="border rounded px-2 py-2" type="time" defaultValue="15:00" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Capacity</label>
                <input name="capacity" className="border rounded px-2 py-2" type="number" min="1" placeholder="Seats" defaultValue="5" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Price (EUR)</label>
                <input name="price" className="border rounded px-2 py-2" type="number" step="0.01" min="0.01" placeholder="e.g. 40" defaultValue="40" required />
              </div>
              <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded border" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button className="bg-gray-900 text-white rounded px-4 py-2">Add Workshop</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
