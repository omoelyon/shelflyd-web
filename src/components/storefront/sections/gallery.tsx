'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { GallerySection } from '@/lib/storefront/design';
import { cn } from '@/lib/utils';
import { stagger } from '../motion';
import SafeImage from './safe-image';

/** A grid of square photos; tapping one opens it larger. */
export default function Gallery({ section }: { section: GallerySection }) {
  const { title, images } = section.props;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (images.length === 0) return null;
  const current = openIndex == null ? null : images[openIndex];
  const columns = images.length === 1 ? 'grid-cols-1 max-w-md' : images.length === 2 ? 'grid-cols-2 max-w-3xl' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <section aria-label={title || 'Photo gallery'} className="max-w-7xl mx-auto px-4 pt-10">
      {title.trim() && <h2 className="mb-6 text-xl font-semibold">{title}</h2>}
      <ul className={cn('grid gap-3', columns)}>
        {images.map((img, i) => (
          <li key={`${img.url}-${i}`} className="sf-rise" style={stagger(i)}>
            <figure>
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={img.caption ? `Enlarge photo: ${img.caption}` : `Enlarge photo ${i + 1}`}
                className="group relative block aspect-square w-full overflow-hidden rounded-xl bg-muted outline-none transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <SafeImage src={img.url} alt={img.caption} sizes="(min-width: 768px) 33vw, 50vw" className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105" />
              </button>
              {img.caption && <figcaption className="mt-1.5 text-xs text-muted-foreground">{img.caption}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>

      <Dialog open={current != null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="duration-200 sm:max-w-3xl">
          <DialogTitle className="sr-only">{current?.caption || 'Photo'}</DialogTitle>
          <DialogDescription className="sr-only">An enlarged photo from the gallery.</DialogDescription>
          {current && (
            <div className="space-y-2">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
                <SafeImage src={current.url} alt={current.caption} className="object-contain" />
              </div>
              {current.caption && <p className="text-sm text-muted-foreground">{current.caption}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
