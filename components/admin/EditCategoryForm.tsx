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
  imageUrl?: string | null;
  imageAlt?: string | null;
  imageCaption?: string | null;
  imageTitle?: string | null;
};

type Props = {
  category: Category;
  action: (formData: FormData) => Promise<void>;
};

export default function EditCategoryForm({ category, action }: Props) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  function markDirty() {
    setIsDirty(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Clear dirty flag before the server action resolves so the guard does not
    // fire on the programmatic redirect.
    setIsDirty(false);
    startTransition(async () => {
      try {
        await action(formData);
        // Task 35: show a success toast so admins know the save worked.
        toast.success('Category saved successfully.');
        router.push('/admin/categories');
      } catch {
        setIsDirty(true); // restore guard in case of error
        toast.error('Failed to save category. Please try again.');
      }
    });
  }

  return (
    <>
      {/* Task 20: warn before navigating away with unsaved changes */}
      <UnsavedChangesGuard isDirty={isDirty} />

      <form
        onSubmit={handleSubmit}
        onChange={markDirty}
        className="space-y-6 border rounded p-6 bg-white"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: image upload */}
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

          {/* Right: name + SEO fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                className={INPUT_CLASS}
                name="name"
                defaultValue={category.name}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Alt Text <span className="text-xs text-gray-400">(SEO — describes the image for search engines)</span>
              </label>
              <input
                className={INPUT_CLASS}
                name="imageAlt"
                defaultValue={category.imageAlt ?? ''}
                placeholder="e.g. Colourful epoxy resin pour workshop"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Title <span className="text-xs text-gray-400">(shown as tooltip on hover)</span>
              </label>
              <input
                className={INPUT_CLASS}
                name="imageTitle"
                defaultValue={category.imageTitle ?? ''}
                placeholder="e.g. Epoxy Pour Workshop — Giftoria"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image Caption <span className="text-xs text-gray-400">(shown below image on the public page)</span>
              </label>
              <input
                className={INPUT_CLASS}
                name="imageCaption"
                defaultValue={category.imageCaption ?? ''}
                placeholder="e.g. Participants creating epoxy art"
              />
            </div>
          </div>
        </div>

        <div>
          <ClientOnly>
            <EditorField
              name="description"
              label="Description"
              defaultValue={category.description ?? ''}
              placeholder="Write a description..."
            />
          </ClientOnly>
        </div>

        <div className="flex gap-3 pt-2 border-t">
          {/* Task 42: button is disabled while the server action is in-flight */}
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
