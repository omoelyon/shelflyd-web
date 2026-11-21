'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A small product photo; a photo that no longer loads (or no photo at all) shows the same box icon. */
export default function ProductThumb({ src, name, className }: { src: string | null; name: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src && failedSrc !== src;
  return (
    <span className={cn('relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f1f5f9]', className)}>
      {showImage ? (
        <Image src={src} alt="" fill sizes="40px" className="object-cover" unoptimized onError={() => setFailedSrc(src)} />
      ) : (
        <Package className="h-4 w-4 text-[#94a3b8]" aria-label={name} />
      )}
    </span>
  );
}
