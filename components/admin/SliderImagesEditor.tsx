"use client";
import { useRef, useState } from 'react';

export default function SliderImagesEditor({ initial = [] as string[] }) {
  const [images, setImages] = useState<string[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Drag-to-reorder state ──────────────────────────────────────
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function onDragStart(i: number) {
    dragIndex.current = i;
  }
  function onDragEnter(i: number) {
    setDragOver(i);
  }
  function onDragEnd() {
    setDragOver(null);
    dragIndex.current = null;
  }
  function onDrop(i: number) {
    const from = dragIndex.current;
    if (from === null || from === i) { setDragOver(null); return; }
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return next;
    });
    setDragOver(null);
    dragIndex.current = null;
  }

  // ── Upload ─────────────────────────────────────────────────────
  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'Upload failed'); break; }
        setImages((prev) => [...prev, data.url]);
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ── Delete ─────────────────────────────────────────────────────
  async function deleteImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
    // Only attempt disk deletion for locally uploaded files
    if (url.startsWith('/uploads/slider/')) {
      await fetch('/api/admin/upload/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    }
  }

  // ── Drop zone drag-over (for file drop, not reorder) ───────────
  function onZoneDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onZoneDrop(e: React.DragEvent) {
    e.preventDefault();
    uploadFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      {/* Hidden inputs carry the ordered URLs into the form */}
      {images.map((url) => (
        <input key={url} type="hidden" name="sliderImages" value={url} />
      ))}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div
              key={url}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              onDragEnd={onDragEnd}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing select-none ${
                dragOver === i ? 'border-[#c99706] scale-105 shadow-lg' : 'border-gray-200'
              }`}
            >
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Slide ${i + 1}`}
                className="w-full aspect-video object-cover pointer-events-none"
              />

              {/* Order badge */}
              <div className="absolute top-1 left-1 bg-black/50 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {i + 1}
              </div>

              {/* Drag handle hint */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/50 rounded px-1.5 py-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zm-6 6a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z" />
                  </svg>
                </div>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => deleteImage(url)}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                aria-label="Delete image"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={onZoneDragOver}
        onDrop={onZoneDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 hover:border-[#c99706] rounded-xl p-8 text-center cursor-pointer transition-colors group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-[#c99706]">
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-sm font-medium">Uploading…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-[#c99706] transition-colors">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-sm font-medium">Click or drag images here to upload</p>
            <p className="text-xs">JPEG, PNG, WebP, GIF — max 4 MB each</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-500">Drag thumbnails to reorder. Changes are saved when you click &quot;Save settings&quot;.</p>
      )}
    </div>
  );
}
