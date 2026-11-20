'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import SafeImage from '@/components/storefront/sections/safe-image';
import { cn } from '@/lib/utils';
import type { ProductStatus } from '@/types';

const RATIO_CLASS = { square: 'aspect-square', portrait: 'aspect-[3/4]', wide: 'aspect-video' } as const;
const EASE = 'ease-[cubic-bezier(0.22,1,0.36,1)]';
const SWIPE_DISTANCE = 40;

interface ProductGalleryProps {
  /** The product's photos in order, cover first (use `productImages(product)`). */
  images: string[];
  /** The product's name, for alt text and labels. */
  alt: string;
  ratio?: keyof typeof RATIO_CLASS;
  className?: string;
  /** Dims the photos of a sold-out product, for pages that do that. */
  status?: ProductStatus;
  /** The storefront editor's preview: photos can be browsed but never opened full screen. */
  inert?: boolean;
}

/**
 * Swipe detection for touch and pen (a mouse never drags the photo, so a desktop click stays a click). Vertical
 * scrolling is left to the browser through `touch-action: pan-y` on the element. `consumedClick()` tells a click
 * handler whether the gesture that just ended was a swipe, so a swipe doesn't also open the photo.
 */
function useSwipe(onPrev: () => void, onNext: () => void) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const swiped = useRef(false);
  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      swiped.current = false;
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    },
    onPointerUp: (e: PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s || s.id !== e.pointerId) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.2) {
        swiped.current = true;
        if (dx < 0) onNext();
        else onPrev();
      }
    },
    onPointerCancel: () => {
      start.current = null;
    },
    /** True (once) if the gesture that just ended was a swipe. */
    consumedClick: () => {
      const was = swiped.current;
      swiped.current = false;
      return was;
    },
  };
}

/**
 * A product's photos: a large photo that cross-fades between them, thumbnails, arrows, a counter, swipe on touch
 * screens, arrow keys, and a full-screen view. With one photo it is just the photo (still tappable to enlarge); with
 * none it is the "No image" block. Used by the storefront product page and the marketplace product page.
 */
export default function ProductGallery({ images, alt, ratio = 'square', className, status, inert = false }: ProductGalleryProps) {
  const count = images.length;
  const multi = count > 1;
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // The photo list can change (editor preview, a refetch): never point past the end.
  const current = Math.min(index, Math.max(count - 1, 0));

  const go = useCallback(
    (to: number) => {
      if (count < 2) return;
      setInteracted(true);
      setIndex(((to % count) + count) % count);
    },
    [count],
  );
  const prev = useCallback(() => go(current - 1), [go, current]);
  const next = useCallback(() => go(current + 1), [go, current]);

  // After the first interaction, fetch the neighbours so the next change is instant.
  useEffect(() => {
    if (!interacted || count < 2) return;
    for (const i of [current + 1, current - 1]) {
      const src = images[((i % count) + count) % count];
      if (src) new window.Image().src = src;
    }
  }, [interacted, current, count, images]);

  // Keep the active thumbnail in view in the strip, scrolling the strip only (never the page).
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = thumbRefs.current[current];
    if (!multi || !strip || !thumb) return;
    const left = thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [current, multi]);

  const swipe = useSwipe(prev, next);
  const lightboxSwipe = useSwipe(prev, next);

  const onKeyDown = (e: KeyboardEvent) => {
    if (!multi) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }
  };

  if (count === 0) {
    return (
      <div className={cn('relative w-full overflow-hidden rounded-2xl bg-muted', RATIO_CLASS[ratio], className)}>
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No image</div>
      </div>
    );
  }

  const isNear = (i: number) => {
    const gap = Math.abs(i - current);
    return Math.min(gap, count - gap) <= 1;
  };
  const dim = status === 'OUT_OF_STOCK' ? 'opacity-60 grayscale' : '';
  const label = `Photo ${current + 1} of ${count}`;
  const arrowClass = cn(
    'absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0b1220] shadow-md outline-none',
    // Always reachable by keyboard and screen reader, but only drawn for pointer devices that can hover, or on focus.
    'opacity-0 transition-[opacity,scale] duration-300',
    EASE,
    '[@media(hover:hover)]:group-hover/gal:opacity-100 group-focus-within/gal:opacity-100 focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/60',
    'hover:scale-105 active:scale-95',
  );

  return (
    <>
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`Photos of ${alt}`}
        onKeyDown={onKeyDown}
        className={cn('w-full', className)}
      >
        <div
          className={cn('group/gal relative w-full overflow-hidden rounded-2xl bg-muted', RATIO_CLASS[ratio], multi && 'touch-pan-y')}
          {...(multi ? { onPointerDown: swipe.onPointerDown, onPointerUp: swipe.onPointerUp, onPointerCancel: swipe.onPointerCancel } : {})}
        >
          <button
            type="button"
            aria-disabled={inert || undefined}
            onClick={() => {
              if (swipe.consumedClick() || inert) return;
              setOpen(true);
            }}
            aria-label={multi ? `Enlarge ${label.toLowerCase()}` : 'Enlarge photo'}
            className={cn('absolute inset-0 block outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/60', inert ? 'cursor-default' : 'cursor-zoom-in')}
          >
            {images.map((src, i) => (
              <span
                key={`${src}-${i}`}
                aria-hidden={i !== current}
                className={cn(
                  'absolute inset-0 block transition-[opacity,scale] duration-[400ms]',
                  EASE,
                  i === current ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-[1.03]',
                  dim,
                )}
              >
                <SafeImage src={src} alt={i === current ? alt : ''} priority={i === 0} />
              </span>
            ))}
          </button>

          {multi && (
            <>
              <button type="button" onClick={prev} aria-label="Previous photo" className={cn(arrowClass, 'left-2.5')}>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={next} aria-label="Next photo" className={cn(arrowClass, 'right-2.5')}>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tabular-nums text-white backdrop-blur-sm"
              >
                {current + 1} / {count}
              </span>
            </>
          )}
        </div>

        {multi && (
          <div ref={stripRef} className="mt-3 flex gap-2 overflow-x-auto p-1 pb-2 [scrollbar-width:thin]">
            {images.map((src, i) => {
              const active = i === current;
              return (
                <button
                  key={`${src}-${i}`}
                  ref={(el) => {
                    thumbRefs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show photo ${i + 1} of ${count}`}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted outline-none transition-[opacity,box-shadow,scale] duration-300 active:scale-95',
                    EASE,
                    active ? 'opacity-100 ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-70 hover:opacity-100',
                    'focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <SafeImage src={src} alt="" className={dim} />
                </button>
              );
            })}
          </div>
        )}

        {/* Said aloud, not shown: which photo is on screen. */}
        {multi && (
          <span className="sr-only" aria-live="polite">
            {label}
          </span>
        )}
      </div>

      {/* Full-screen view. It sits outside the carousel group so its arrow keys don't bubble into the page's gallery twice. */}
      <Dialog open={open && !inert} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 bg-neutral-950 p-2 text-white ring-white/10 sm:max-w-4xl sm:p-3"
          onKeyDown={(e) => {
            if (!multi) return;
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              prev();
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              next();
            }
          }}
        >
          <DialogTitle className="sr-only">{`${alt}, ${label.toLowerCase()}`}</DialogTitle>
          <DialogDescription className="sr-only">A larger view of the product photo. Use the arrow keys to see the other photos.</DialogDescription>
          <div
            className={cn('relative h-[min(72vh,720px)] w-full touch-pan-y overflow-hidden rounded-lg', multi && 'select-none')}
            {...(multi ? { onPointerDown: lightboxSwipe.onPointerDown, onPointerUp: lightboxSwipe.onPointerUp, onPointerCancel: lightboxSwipe.onPointerCancel } : {})}
          >
            {images.map((src, i) => (
              <div
                key={`${src}-${i}`}
                aria-hidden={i !== current}
                className={cn('absolute inset-0 transition-opacity duration-300', EASE, i === current ? 'opacity-100' : 'pointer-events-none opacity-0')}
              >
                {/* Only the current photo and its neighbours are mounted, so five large photos aren't all fetched for a quick look. */}
                {isNear(i) && <SafeImage src={src} alt={i === current ? alt : ''} className="object-contain" />}
              </div>
            ))}
          </div>
          {multi && (
            <div className="mt-2 flex items-center justify-between px-1 text-sm text-white/80">
              <span className="tabular-nums">
                {current + 1} / {count}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous photo"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 outline-none transition-[background-color,scale] duration-200 hover:bg-white/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next photo"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 outline-none transition-[background-color,scale] duration-200 hover:bg-white/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          <DialogClose
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white outline-none transition-[background-color,scale] duration-200 hover:bg-black/80 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
