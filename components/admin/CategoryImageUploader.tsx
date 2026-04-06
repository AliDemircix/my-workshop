"use client";
import { useRef, useState } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

export default function CategoryImageUploader({
  initialUrl,
  categoryName,
  onUpload,
  folder = 'categories',
  inputName = 'imageUrl',
}: {
  initialUrl?: string | null;
  categoryName?: string;
  /** Called with the new URL after a successful upload, or null after removal. */
  onUpload?: (url: string | null) => void;
  folder?: string;
  inputName?: string;
}) {
  const [url, setUrl] = useState<string>(initialUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    // Client-side pre-validation (task 31)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('File is too large. Maximum size is 4 MB.');
      return;
    }

    setUploading(true);
    try {
      // If there is already an uploaded image, delete it before uploading the
      // new one so we do not leave orphaned files on disk (task 34).
      if (url && url.startsWith(`/uploads/${folder}/`)) {
        const delRes = await fetch('/api/admin/upload/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        // Non-fatal: log but continue with the upload regardless.
        if (!delRes.ok) {
          console.warn('Could not delete previous image:', url);
        }
      }

      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      if (categoryName) fd.append('name', categoryName);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Upload failed'); return; }
      setUrl(data.url);
      onUpload?.(data.url);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function removeImage() {
    if (url.startsWith(`/uploads/${folder}/`)) {
      // Task 45: handle delete API errors instead of silently orphaning the file.
      try {
        const res = await fetch('/api/admin/upload/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Failed to remove image. Please try again.');
          return;
        }
      } catch {
        setError('Failed to remove image. Please try again.');
        return;
      }
    }
    setUrl('');
    onUpload?.(null);
  }

  return (
    <div className="space-y-2">
      {/* Hidden input carries the URL into the server action form */}
      <input type="hidden" name={inputName} value={url} />

      {url ? (
        <div className="relative inline-block group">
          <img
            src={url}
            alt="Category preview"
            className="h-36 w-56 object-cover rounded-lg border border-gray-200 shadow-sm"
          />
          {/* Task 32: always visible on touch/keyboard; hover-fade only on pointer devices */}
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center
              opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100
              transition-opacity shadow"
            aria-label="Remove image"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-xs text-[#c99706] hover:underline focus-visible:underline focus-visible:outline-none block"
          >
            Replace image
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload image — click or drop a file here"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="flex flex-col items-center justify-center w-56 h-36 border-2 border-dashed border-gray-300 hover:border-[#c99706] rounded-lg cursor-pointer transition-colors group
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:border-[#c99706]"
        >
          {uploading ? (
            <svg className="w-6 h-6 animate-spin text-[#c99706]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-300 group-hover:text-[#c99706] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-xs text-gray-400 group-hover:text-[#c99706] mt-1 transition-colors">Click or drop image</span>
              {/* Task 31: GIF is now listed as a valid type in the hint copy */}
              <span className="text-xs text-gray-300 mt-0.5">JPEG, PNG, WebP, GIF · max 4 MB</span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
