'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { canOptimizeImage } from '@/lib/image';

/**
 * A seller-supplied photo that fills its (relatively positioned) box. If the URL doesn't load, a soft muted block
 * with a small picture icon takes its place, so the box keeps its size and there is no broken-image icon. The
 * failure is remembered per URL, so fixing the address in the editor tries again.
 */
export default function SafeImage({
  src,
  alt,
  className,
  priority,
  sizes = '100vw',
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  /** How wide it is drawn, so phones download a small copy (see next/image `sizes`). */
  sizes?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground/50" role="img" aria-label={alt || undefined}>
        <ImageIcon className="h-8 w-8" aria-hidden="true" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={!canOptimizeImage(src)}
      priority={priority}
      onError={() => setFailedSrc(src)}
      className={cn('sf-img-in object-cover', className)}
    />
  );
}
