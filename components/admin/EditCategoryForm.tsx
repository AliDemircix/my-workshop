"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ClientOnly from '@/components/ClientOnly';
import CategoryImageUploader from '@/components/admin/CategoryImageUploader';
import EditorField from '@/components/admin/EditorField';
import UnsavedChangesGuard from '@/components/admin/UnsavedChangesGuard';

const INPUT_CLASS =
  'border rounded px-3 py-2 w-full text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:border-[#c99706]';

type Category = {
  id: number;
  name: string;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionTr?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  imageCaption?: string | null;
  imageTitle?: string | null;
};

type Props = {
  category: Category;
  action: (formData: FormData) => Promise<void>;
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
      toast.error('Write the Dutch description first before translating.');
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

export default function EditCategoryForm({ category, action }: Props) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Track primary (Dutch) description so TranslateButton can read it live
  const [primaryDesc, setPrimaryDesc] = useState(category.description ?? '');

  // Translated overrides — keyed so EditorField remounts with new defaultValue
  const [enValue, setEnValue] = useState(category.descriptionEn ?? '');
  const [trValue, setTrValue] = useState(category.descriptionTr ?? '');
  const [enKey, setEnKey] = useState(0);
  const [trKey, setTrKey] = useState(0);

  function markDirty() { setIsDirty(true); }

  function applyEnTranslation(text: string) {
    setEnValue(text);
    setEnKey(k => k + 1); // remount EditorField with new default
    markDirty();
  }

  function applyTrTranslation(text: string) {
    setTrValue(text);
    setTrKey(k => k + 1);
    markDirty();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsDirty(false);
    startTransition(async () => {
      try {
        await action(formData);
        toast.success('Category saved successfully.');
        router.push('/admin/categories');
      } catch {
        setIsDirty(true);
        toast.error('Failed to save category. Please try again.');
      }
    });
  }

  return (
    <>
      <UnsavedChangesGuard isDirty={isDirty} />

      <form onSubmit={handleSubmit} onChange={markDirty} className="space-y-6 border rounded p-6 bg-white">

        {/* Image + meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Category Image</label>
            <ClientOnly>
              <CategoryImageUploader
                initialUrl={category.imageUrl}
                categoryName={category.name}
                onUpload={markDirty}
              />
            </ClientOnly>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input className={INPUT_CLASS} name="name" defaultValue={category.name} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Alt Text <span className="text-xs text-gray-400">(SEO)</span>
              </label>
              <input className={INPUT_CLASS} name="imageAlt" defaultValue={category.imageAlt ?? ''} placeholder="e.g. Colourful epoxy resin pour workshop" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Title <span className="text-xs text-gray-400">(tooltip on hover)</span>
              </label>
              <input className={INPUT_CLASS} name="imageTitle" defaultValue={category.imageTitle ?? ''} placeholder="e.g. Epoxy Pour Workshop — Giftoria" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Caption <span className="text-xs text-gray-400">(shown below image)</span>
              </label>
              <input className={INPUT_CLASS} name="imageCaption" defaultValue={category.imageCaption ?? ''} placeholder="e.g. Participants creating epoxy art" />
            </div>
          </div>
        </div>

        {/* ── Descriptions ── */}
        <div className="space-y-6 border-t pt-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Descriptions</h3>
            <p className="text-xs text-gray-400 mt-0.5">Write the primary Dutch description, then use the buttons to auto-translate. You can edit any translation manually before saving.</p>
          </div>

          {/* 🇳🇱 Dutch — primary */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">🇳🇱 Dutch <span className="text-gray-400 font-normal">(primary source)</span></label>
            <ClientOnly>
              <EditorField
                name="description"
                label=""
                defaultValue={category.description ?? ''}
                placeholder="Write the Dutch description…"
                onValueChange={setPrimaryDesc}
              />
            </ClientOnly>
          </div>

          {/* 🇬🇧 English */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">🇬🇧 English</label>
              <TranslateButton sourceText={primaryDesc} targetLang="EN" onTranslated={applyEnTranslation} />
            </div>
            <ClientOnly>
              <EditorField
                key={enKey}
                name="descriptionEn"
                label=""
                defaultValue={enValue}
                placeholder="English translation — auto-translate or type manually…"
              />
            </ClientOnly>
          </div>

          {/* 🇹🇷 Turkish */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">🇹🇷 Turkish</label>
              <TranslateButton sourceText={primaryDesc} targetLang="TR" onTranslated={applyTrTranslation} />
            </div>
            <ClientOnly>
              <EditorField
                key={trKey}
                name="descriptionTr"
                label=""
                defaultValue={trValue}
                placeholder="Turkish translation — auto-translate or type manually…"
              />
            </ClientOnly>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t">
          <button
            type="submit"
            disabled={isPending}
            className="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-1"
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
          <a
            href="/admin/categories"
            className="underline text-gray-600 self-center text-sm hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] rounded"
          >
            Cancel
          </a>
        </div>
      </form>
    </>
  );
}
