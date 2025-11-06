"use client";

import { useEffect, useMemo, useState } from 'react';
import ClientOnly from '@/components/ClientOnly';
import EditorField from '@/components/admin/EditorField';

type Category = {
  id: number;
  name: string;
  imageUrl?: string | null;
  description?: string | null; // short
  longDescription?: string | null;
};

type Props = {
  categories: Category[];
  save: (formData: FormData) => Promise<void>;
};

export default function HomeCategoriesTabs({ categories, save }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    if (activeId == null && categories.length > 0) {
      setActiveId(categories[0].id);
    }
  }, [categories, activeId]);

  const active = useMemo(() => categories.find((c) => c.id === activeId) ?? null, [categories, activeId]);

  return (
    <div className="border rounded">
      <div className="flex flex-wrap">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveId(c.id)}
            className={[
              'px-3 py-2 text-sm border-b md:min-w-[10rem] text-left',
              activeId === c.id ? 'font-semibold bg-gray-50' : 'hover:bg-gray-50',
            ].join(' ')}
          >
            {c.name}
          </button>
        ))}
      </div>

      {active && (
        <section className="p-4 space-y-4">
          <h3 className="font-medium text-lg">{active.name}</h3>
          {/* Key the form to the active category to reset defaultValue fields when switching tabs */}
          <form key={active.id} action={save} className="space-y-4">
            <input type="hidden" name="id" value={active.id} />

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input key={`img-${active.id}`} className="border rounded px-3 py-2 w-full" name="imageUrl" defaultValue={active.imageUrl ?? ''} placeholder="https://..." />
            </div>

            {/* Short Description (home) */}
            <div>
              <ClientOnly>
                <EditorField
                  name="shortDescription"
                  label="Short Description (home)"
                  defaultValue={active.description ?? ''}
                  placeholder="Short intro shown on the home page"
                />
              </ClientOnly>
            </div>

            {/* Long Description (detail page) */}
            <div>
              <ClientOnly>
                <EditorField
                  name="longDescription"
                  label="Long Description (detail page)"
                  defaultValue={active.longDescription ?? ''}
                  placeholder="Write detailed workshop info"
                />
              </ClientOnly>
            </div>

            <div className="flex gap-2">
              <button className="bg-gray-900 text-white rounded px-4 py-2">Save</button>
              <button
                type="button"
                className="underline text-sm"
                onClick={() => {
                  // scroll to top of the tab list
                  const el = document.querySelector('div.border.rounded');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                Back to top
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
