"use client";
import { useEffect, useRef, useState } from 'react';

export default function Slider({ images = [] as string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<HTMLDivElement[]>([]);
  const wasDraggingRef = useRef(false);
  const [drag, setDrag] = useState<{ active: boolean; startX: number; scrollLeft: number; moved: boolean }>({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const children = itemRefs.current.filter(Boolean);
    if (children.length === 0) return;
    const gap = 12;
    const itemWidth = children[0].getBoundingClientRect().width;
    const currentIndex = Math.round(el.scrollLeft / (itemWidth + gap));
    const targetIndex = Math.min(Math.max(0, currentIndex + dir), images.length - 1);
    const targetLeft = targetIndex * (itemWidth + gap);
    el.scrollTo({ left: targetLeft, behavior: 'smooth' });
    setActiveIndex(targetIndex);
  };

  const scrollToIndex = (index: number) => {
    const el = ref.current;
    const children = itemRefs.current.filter(Boolean);
    if (!el || children.length === 0) return;
    const gap = 12;
    const itemWidth = children[0].getBoundingClientRect().width;
    el.scrollTo({ left: index * (itemWidth + gap), behavior: 'smooth' });
    setActiveIndex(index);
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
    // Sync active index after drag
    const children = itemRefs.current.filter(Boolean);
    if (children.length > 0) {
      const gap = 12;
      const itemWidth = children[0].getBoundingClientRect().width;
      setActiveIndex(Math.round(el.scrollLeft / (itemWidth + gap)));
    }
  };

  // Close lightbox on ESC, navigate with ArrowLeft/ArrowRight
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setLightboxIndex(null);
      } else if (ev.key === 'ArrowLeft') {
        setLightboxIndex((i) => (i != null ? Math.max(0, i - 1) : null));
      } else if (ev.key === 'ArrowRight') {
        setLightboxIndex((i) => (i != null ? Math.min(images.length - 1, i + 1) : null));
      }
    };
    if (lightboxIndex != null) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [lightboxIndex, images.length]);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative group w-full space-y-3">
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
                alt={`Workshop creation ${i + 1}`}
                loading={i < 3 ? 'eager' : 'lazy'}
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover/item:scale-105 group-hover/item:rotate-1"
                onClick={() => {
                  if (wasDraggingRef.current) {
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

      {/* Navigation arrows — always visible on mobile, hover-reveal on desktop */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => scrollBy(-1)}
        className="flex absolute left-3 top-[40%] -translate-y-1/2 z-10 items-center justify-center w-11 h-11 rounded-full bg-black/50 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-black/60 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:opacity-0 md:group-hover:opacity-100"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5"><path fill="currentColor" d="M12.78 4.22a.75.75 0 010 1.06L8.06 10l4.72 4.72a.75.75 0 11-1.06 1.06l-5.25-5.25a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z"/></svg>
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => scrollBy(1)}
        className="flex absolute right-3 top-[40%] -translate-y-1/2 z-10 items-center justify-center w-11 h-11 rounded-full bg-black/50 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-black/60 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:opacity-0 md:group-hover:opacity-100"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5"><path fill="currentColor" d="M7.22 4.22a.75.75 0 000 1.06L11.94 10l-4.72 4.72a.75.75 0 101.06 1.06l5.25-5.25a.75.75 0 000-1.06L8.28 4.22a.75.75 0 00-1.06 0z"/></svg>
      </button>

      {/* Dot indicators with 44px touch targets */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1" role="tablist" aria-label="Slide navigation">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={activeIndex === i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className="flex items-center justify-center w-11 h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99706] focus-visible:ring-offset-1 rounded"
            >
              <span
                className={`block rounded-full transition-all duration-200 ${
                  activeIndex === i ? 'w-4 h-2.5 bg-[#c99706]' : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex != null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              aria-label="Close lightbox"
              className="absolute -top-3 -right-3 md:top-0 md:right-0 bg-white text-black rounded-full w-9 h-9 flex items-center justify-center shadow border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => setLightboxIndex(null)}
            >
              ✕
            </button>
            <div className="w-full rounded">
              <img src={images[lightboxIndex]} alt={`Preview ${lightboxIndex + 1}`} className="w-full h-auto max-h-[80vh] object-contain rounded" />
            </div>
            {/* Lightbox prev/next */}
            <button
              type="button"
              aria-label="Previous image"
              disabled={lightboxIndex <= 0}
              onClick={() => setLightboxIndex((i) => (i != null ? Math.max(0, i - 1) : 0))}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-11 h-11 flex items-center justify-center disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5"><path fill="currentColor" d="M12.78 4.22a.75.75 0 010 1.06L8.06 10l4.72 4.72a.75.75 0 11-1.06 1.06l-5.25-5.25a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z"/></svg>
            </button>
            <button
              type="button"
              aria-label="Next image"
              disabled={lightboxIndex >= images.length - 1}
              onClick={() => setLightboxIndex((i) => (i != null ? Math.min(images.length - 1, i + 1) : 0))}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-11 h-11 flex items-center justify-center disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5"><path fill="currentColor" d="M7.22 4.22a.75.75 0 000 1.06L11.94 10l-4.72 4.72a.75.75 0 101.06 1.06l5.25-5.25a.75.75 0 000-1.06L8.28 4.22a.75.75 0 00-1.06 0z"/></svg>
            </button>
            <p className="text-center text-white/60 text-sm mt-2">{lightboxIndex + 1} / {images.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
