"use client";

import { useState, useTransition } from 'react';
import CategoryImageUploader from '@/components/admin/CategoryImageUploader';
import EditorField from '@/components/admin/EditorField';
import UnsavedChangesGuard from '@/components/admin/UnsavedChangesGuard';

const INPUT_CLASS =
  'border rounded px-3 py-2 w-full text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:border-[#c99706]';

type Props = {
  action: (formData: FormData) => Promise<void>;
};

export default function CreateCategoryForm({ action }: Props) {
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Mark form dirty as soon as any upload happens (task 33)
  function handleUpload(url: string | null) {
    setIsDirty(url !== null);
  }

  function handleInputChange() {
    setIsDirty(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Clear dirty state before navigation so the guard does not fire
    setIsDirty(false);
    startTransition(async () => {
      await action(formData);
    });
  }

  return (
    <>
      {/* Task 33 + 20: warn before leaving when the form has unsaved changes */}
      <UnsavedChangesGuard isDirty={isDirty} />

      <form onSubmit={handleSubmit} onChange={handleInputChange} className="space-y-4 border rounded p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Left: image upload */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Category Image</label>
            <CategoryImageUploader onUpload={handleUpload} />
          </div>

          {/* Right: name + SEO fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input className={INPUT_CLASS} name="name" placeholder="e.g. Epoxy Pour Workshop" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Alt Text <span className="text-xs text-gray-400">(SEO)</span>
              </label>
              <input className={INPUT_CLASS} name="imageAlt" placeholder="e.g. Colourful epoxy resin pour workshop" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Title <span className="text-xs text-gray-400">(tooltip on hover)</span>
              </label>
              <input className={INPUT_CLASS} name="imageTitle" placeholder="e.g. Epoxy Pour Workshop — Giftoria" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Caption <span className="text-xs text-gray-400">(shown below image)</span>
              </label>
              <input className={INPUT_CLASS} name="imageCaption" placeholder="e.g. Participants creating epoxy art" />
            </div>
          </div>
        </div>

        <div>
          <EditorField name="description" label="Description (optional)" placeholder="Write a description..." />
        </div>

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-1"
          >
            {isPending ? 'Adding…' : 'Add Category'}
          </button>
        </div>
      </form>
    </>
  );
}
