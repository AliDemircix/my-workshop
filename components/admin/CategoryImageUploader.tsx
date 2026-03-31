"use client";
import { useRef, useState } from 'react';

export default function CategoryImageUploader({
  initialUrl,
  categoryName,
}: {
  initialUrl?: string | null;
  categoryName?: string;
}) {
  const [url, setUrl] = useState<string>(initialUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'categories');
      if (categoryName) fd.append('name', categoryName);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Upload failed'); return; }
      setUrl(data.url);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function removeImage() {
    if (url.startsWith('/uploads/categories/')) {
      await fetch('/api/admin/upload/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    }
    setUrl('');
  }

  return (
    <div className="space-y-2">
      {/* Hidden input carries the URL into the server action form */}
      <input type="hidden" name="imageUrl" value={url} />

      {url ? (
        <div className="relative inline-block group">
          <img
            src={url}
            alt="Category preview"
            className="h-36 w-56 object-cover rounded-lg border border-gray-200 shadow-sm"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
            aria-label="Remove image"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-xs text-[#c99706] hover:underline block"
          >
            Replace image
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="flex flex-col items-center justify-center w-56 h-36 border-2 border-dashed border-gray-300 hover:border-[#c99706] rounded-lg cursor-pointer transition-colors group"
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
              <span className="text-xs text-gray-300 mt-0.5">JPEG, PNG, WebP · max 4 MB</span>
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

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
