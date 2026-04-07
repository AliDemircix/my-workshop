"use client";

import { useState, useTransition } from 'react';
import ClientOnly from '@/components/ClientOnly';
import CategoryImageUploader from '@/components/admin/CategoryImageUploader';

const INPUT_CLASS =
  'w-full border border-gray-300 rounded px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706]/40 focus-visible:border-[#c99706]';

type Category = { id: number; name: string };

type Props = {
  categories: Category[];
  action: (formData: FormData) => Promise<void>;
};

export default function CreateGiftCardForm({ categories, action }: Props) {
  const [isPending, startTransition] = useTransition();
  const [, setImageUrl] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await action(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name (default / NL) */}
        <div>
          <label htmlFor="gc-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
            <span className="ml-1 text-xs text-gray-400 font-normal">(NL / default)</span>
          </label>
          <input
            id="gc-name"
            name="name"
            type="text"
            required
            placeholder="e.g. Pottery Workshop Gift Card"
            className={INPUT_CLASS}
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="gc-price" className="block text-sm font-medium text-gray-700 mb-1">
            Price (€) <span className="text-red-500">*</span>
          </label>
          <input
            id="gc-price"
            name="priceEuros"
            type="number"
            required
            min="1"
            step="0.01"
            placeholder="e.g. 45"
            className={INPUT_CLASS}
          />
        </div>

        {/* Name EN */}
        <div>
          <label htmlFor="gc-name-en" className="block text-sm font-medium text-gray-700 mb-1">
            Name (EN) <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="gc-name-en"
            name="nameEn"
            type="text"
            placeholder="e.g. Pottery Workshop Gift Card"
            className={INPUT_CLASS}
          />
        </div>

        {/* Name TR */}
        <div>
          <label htmlFor="gc-name-tr" className="block text-sm font-medium text-gray-700 mb-1">
            Name (TR) <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="gc-name-tr"
            name="nameTr"
            type="text"
            placeholder="e.g. Çömlek Atölyesi Hediye Kartı"
            className={INPUT_CLASS}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="gc-category" className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            id="gc-category"
            name="categoryId"
            className={`${INPUT_CLASS} bg-white`}
          >
            <option value="">— No category —</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Image uploader */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <ClientOnly>
            <CategoryImageUploader onUpload={setImageUrl} />
          </ClientOnly>
        </div>
      </div>

      {/* Description (default / NL) */}
      <div>
        <label htmlFor="gc-desc" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-gray-400 font-normal">(NL / default, optional)</span>
        </label>
        <textarea
          id="gc-desc"
          name="description"
          rows={2}
          placeholder="Short description shown on the gift card..."
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>

      {/* Description EN */}
      <div>
        <label htmlFor="gc-desc-en" className="block text-sm font-medium text-gray-700 mb-1">
          Description (EN) <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="gc-desc-en"
          name="descriptionEn"
          rows={2}
          placeholder="Short description in English..."
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>

      {/* Description TR */}
      <div>
        <label htmlFor="gc-desc-tr" className="block text-sm font-medium text-gray-700 mb-1">
          Description (TR) <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="gc-desc-tr"
          name="descriptionTr"
          rows={2}
          placeholder="Kısa Türkçe açıklama..."
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold px-5 py-2 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-1"
        >
          {isPending ? 'Creating…' : 'Create Gift Card'}
        </button>
      </div>
    </form>
  );
}
