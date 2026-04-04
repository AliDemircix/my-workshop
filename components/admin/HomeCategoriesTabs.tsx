"use client";

import { useEffect, useMemo, useState } from 'react';
import ClientOnly from '@/components/ClientOnly';
import EditorField from '@/components/admin/EditorField';
import CategoryImageUploader from '@/components/admin/CategoryImageUploader';
import toast from 'react-hot-toast';

type Category = {
  id: number;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionTr?: string | null;
  longDescription?: string | null;
  longDescriptionEn?: string | null;
  longDescriptionTr?: string | null;
};

type Props = {
  categories: Category[];
  save: (formData: FormData) => Promise<void>;
};

function TranslateButton({
  sourceText,
  targetLang,
  onTranslated,
}: {
  sourceText: string;
  targetLang: 'EN' | 'TR';
  onTranslated: (text: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!sourceText.trim()) {
      toast.error('Write the Dutch text first before translating.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, targetLang }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? 'Translation failed');
      }
      const { translated } = await res.json();
      onTranslated(translated);
      toast.success('Translation applied — review and save.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Translation failed');
    } finally {
      setLoading(false);
    }
  }

  const flag = targetLang === 'EN' ? '🇬🇧' : '🇹🇷';
  const lang = targetLang === 'EN' ? 'English' : 'Turkish';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-[#c99706] text-[#c99706] hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? (
        <>
          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Translating…
        </>
      ) : (
        <>{flag} Auto-translate to {lang}</>
      )}
    </button>
  );
}

function DescriptionGroup({
  label,
  fieldNl,
  fieldEn,
  fieldTr,
  defaultNl,
  defaultEn,
  defaultTr,
  placeholder,
  long,
}: {
  label: string;
  fieldNl: string;
  fieldEn: string;
  fieldTr: string;
  defaultNl: string;
  defaultEn: string;
  defaultTr: string;
  placeholder: string;
  long?: boolean;
}) {
  const [nlText, setNlText] = useState(defaultNl);
  const [enValue, setEnValue] = useState(defaultEn);
  const [trValue, setTrValue] = useState(defaultTr);
  const [enKey, setEnKey] = useState(0);
  const [trKey, setTrKey] = useState(0);

  // Reset when defaults change (tab switch)
  useEffect(() => {
    setNlText(defaultNl);
    setEnValue(defaultEn);
    setTrValue(defaultTr);
    setEnKey(k => k + 1);
    setTrKey(k => k + 1);
  }, [defaultNl, defaultEn, defaultTr]);

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
      <h4 className="text-sm font-semibold text-gray-700">{label}</h4>

      {/* 🇳🇱 Dutch */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">🇳🇱 Dutch <span className="text-gray-400 font-normal">(primary)</span></label>
        <ClientOnly>
          <EditorField
            name={fieldNl}
            label=""
            defaultValue={defaultNl}
            placeholder={placeholder}
            onValueChange={setNlText}
          />
        </ClientOnly>
      </div>

      {/* 🇬🇧 English */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-600">🇬🇧 English</label>
          <TranslateButton
            sourceText={nlText}
            targetLang="EN"
            onTranslated={(text) => { setEnValue(text); setEnKey(k => k + 1); }}
          />
        </div>
        <ClientOnly>
          <EditorField
            key={enKey}
            name={fieldEn}
            label=""
            defaultValue={enValue}
            placeholder="English translation…"
          />
        </ClientOnly>
      </div>

      {/* 🇹🇷 Turkish */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-gray-600">🇹🇷 Turkish</label>
          <TranslateButton
            sourceText={nlText}
            targetLang="TR"
            onTranslated={(text) => { setTrValue(text); setTrKey(k => k + 1); }}
          />
        </div>
        <ClientOnly>
          <EditorField
            key={trKey}
            name={fieldTr}
            label=""
            defaultValue={trValue}
            placeholder="Turkish translation…"
          />
        </ClientOnly>
      </div>
    </div>
  );
}

export default function HomeCategoriesTabs({ categories, save }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    if (activeId == null && categories.length > 0) setActiveId(categories[0].id);
  }, [categories, activeId]);

  const active = useMemo(() => categories.find((c) => c.id === activeId) ?? null, [categories, activeId]);

  return (
    <div className="border rounded">
      {/* Tab bar */}
      <div className="flex flex-wrap border-b">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveId(c.id)}
            className={[
              'px-3 py-2 text-sm md:min-w-[10rem] text-left transition-colors',
              activeId === c.id
                ? 'font-semibold bg-white border-b-2 border-[#c99706] -mb-px text-[#c99706]'
                : 'text-gray-600 hover:bg-gray-50 border-b-2 border-transparent',
            ].join(' ')}
            aria-current={activeId === c.id ? 'page' : undefined}
          >
            {c.name}
          </button>
        ))}
      </div>

      {active && (
        <section className="p-4 space-y-6">
          <h3 className="font-medium text-lg">{active.name}</h3>

          <form key={active.id} action={save} className="space-y-6">
            <input type="hidden" name="id" value={active.id} />

            {/* Image */}
            <div>
              <label className="block text-sm font-medium mb-1">Category Image</label>
              <ClientOnly>
                <CategoryImageUploader
                  key={`img-${active.id}`}
                  initialUrl={active.imageUrl}
                  categoryName={active.name}
                />
              </ClientOnly>
            </div>

            {/* Short description — 3 languages */}
            <DescriptionGroup
              key={`short-${active.id}`}
              label="Short Description (shown on home page cards)"
              fieldNl="shortDescription"
              fieldEn="shortDescriptionEn"
              fieldTr="shortDescriptionTr"
              defaultNl={active.description ?? ''}
              defaultEn={active.descriptionEn ?? ''}
              defaultTr={active.descriptionTr ?? ''}
              placeholder="Short intro shown on the home page…"
            />

            {/* Long description — 3 languages */}
            <DescriptionGroup
              key={`long-${active.id}`}
              label="Long Description (shown on workshop detail page)"
              fieldNl="longDescription"
              fieldEn="longDescriptionEn"
              fieldTr="longDescriptionTr"
              defaultNl={active.longDescription ?? ''}
              defaultEn={active.longDescriptionEn ?? ''}
              defaultTr={active.longDescriptionTr ?? ''}
              placeholder="Detailed workshop info…"
              long
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-1"
              >
                Save
              </button>
              <button
                type="button"
                className="underline text-sm text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] rounded"
                onClick={() => {
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
