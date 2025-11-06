"use client";
import { useEffect, useRef, useState } from 'react';

export default function Slider({ images = [] as string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<HTMLDivElement[]>([]);
  const wasDraggingRef = useRef(false);
  const [drag, setDrag] = useState<{ active: boolean; startX: number; scrollLeft: number; moved: boolean }>({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    // Find the first fully visible item and compute its width including gap
    const children = itemRefs.current.filter(Boolean);
    if (children.length === 0) return;

    // Determine current index based on scrollLeft and item width
    const gap = 12; // gap-3 is 0.75rem = 12px
    // Estimate current item width from the first child
    const itemWidth = children[0].getBoundingClientRect().width;
    const currentIndex = Math.round(el.scrollLeft / (itemWidth + gap));
    const targetIndex = Math.min(Math.max(0, currentIndex + dir), images.length - 1);
    const targetLeft = targetIndex * (itemWidth + gap);
    el.scrollTo({ left: targetLeft, behavior: 'smooth' });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    wasDraggingRef.current = false;
    setDrag({ active: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false });
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !drag.active) return;
    const dx = e.clientX - drag.startX;
    el.scrollLeft = drag.scrollLeft - dx;
    if (Math.abs(dx) > 5 && !drag.moved) {
      wasDraggingRef.current = true;
      setDrag((d) => ({ ...d, moved: true }));
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    el.releasePointerCapture(e.pointerId);
    setDrag((d) => ({ ...d, active: false }));
  };

  // Close lightbox on ESC
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setLightboxIndex(null);
    };
    if (lightboxIndex != null) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [lightboxIndex]);
  if (!images || images.length === 0) return null;
  return (
    <div className="relative group w-full">
      <div
        ref={ref}
        className={`flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 pr-4 select-none ${drag.active ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ scrollBehavior: 'smooth' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {images.map((src, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) itemRefs.current[i] = el;
            }}
            className="snap-start min-w-[80%] sm:min-w-[60%] md:min-w-[50%] lg:min-w-[33.3333%]"
          >
            <div className="w-full h-64 sm:h-72 md:h-80 lg:h-96 rounded overflow-hidden border group/item relative">
              <img
                src={src}
                alt={`Slide ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover/item:scale-105 group-hover/item:rotate-1"
                onClick={(e) => {
                  if (wasDraggingRef.current) {
                    // suppress click when drag happened
                    wasDraggingRef.current = false;
                    return;
                  }
                  setLightboxIndex(i);
                }}
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Previous"
        onClick={() => scrollBy(-1)}
        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-11 h-11 rounded-full bg-black/50 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition group-hover:flex hover:bg-black/60 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5"><path fill="currentColor" d="M12.78 4.22a.75.75 0 010 1.06L8.06 10l4.72 4.72a.75.75 0 11-1.06 1.06l-5.25-5.25a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z"/></svg>
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => scrollBy(1)}
        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-11 h-11 rounded-full bg-black/50 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition group-hover:flex hover:bg-black/60 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5"><path fill="currentColor" d="M7.22 4.22a.75.75 0 000 1.06L11.94 10l-4.72 4.72a.75.75 0 101.06 1.06l5.25-5.25a.75.75 0 000-1.06L8.28 4.22a.75.75 0 00-1.06 0z"/></svg>
      </button>

      {lightboxIndex != null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              aria-label="Close"
              className="absolute -top-3 -right-3 md:top-0 md:right-0 bg-white text-black rounded-full w-9 h-9 flex items-center justify-center shadow border"
              onClick={() => setLightboxIndex(null)}
            >
              ✕
            </button>
            <div className="w-full rounded">
              <img src={images[lightboxIndex]} alt="Preview" className="w-full h-auto max-h-[80vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
