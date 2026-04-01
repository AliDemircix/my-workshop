"use client";

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

type Photo = { id: number; url: string };

type Props = {
  categoryId: number;
  categoryName: string;
  initialPhotos: Photo[];
};

export default function EventPhotosManager({ categoryId, categoryName, initialPhotos }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploadError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Unsupported file type. Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError('File is too large. Maximum size is 4 MB.');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload the file to disk
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'categories');
      fd.append('name', categoryName);
      const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setUploadError(uploadData.error ?? 'Upload failed');
        return;
      }

      // 2. Persist the URL in the DB
      const saveRes = await fetch(`/api/categories/${categoryId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: uploadData.url }),
      });
      if (!saveRes.ok) {
        const saveData = await saveRes.json().catch(() => ({}));
        setUploadError(saveData.error ?? 'Failed to save photo');
        return;
      }

      toast.success('Photo added.');
      router.refresh();
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(photo: Photo) {
    setDeletingId(photo.id);
    try {
      const res = await fetch(`/api/categories/${categoryId}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: photo.url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? 'Failed to delete photo');
        return;
      }
      toast.success('Photo removed.');
      router.refresh();
    } catch {
      toast.error('Failed to delete photo. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4 border rounded p-6 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Event Photos</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Photos shown as a gallery on the public workshop page.
          </p>
        </div>

        {/* Upload trigger button */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 bg-gray-900 text-white rounded px-3 py-1.5 text-sm font-medium
            transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-1"
        >
          {uploading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Uploading…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Add Photo
            </>
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {uploadError && (
        <p className="text-xs text-red-600" role="alert">{uploadError}</p>
      )}

      {initialPhotos.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
          No event photos yet. Click "Add Photo" to upload the first one.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {initialPhotos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <img
                src={photo.url}
                alt="Event photo"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                disabled={deletingId === photo.id}
                onClick={() => handleDelete(photo)}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center
                  opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100
                  transition-opacity shadow disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Delete photo"
              >
                {deletingId === photo.id ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
