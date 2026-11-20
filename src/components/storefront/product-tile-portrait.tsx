'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { SfLink } from './sf-link';
import { useStorefront } from './storefront-context';

/**
 * The "portrait" product look: a tall 3:4 photo with just the name and price underneath, no card around it.
 * Meant for fashion, beauty and gifts, where the picture does the selling.
 */
export default function ProductTilePortrait({ product, className, style }: { product: Product; className?: string; style?: CSSProperties }) {
  const { slug } = useStorefront();
  const [imageFailed, setImageFailed] = useState(false);
  const lowest = product.prices?.reduce((min, p) => (p.price < min.price ? p : min), product.prices[0]);
  const soldOut = product.status === 'OUT_OF_STOCK';

  return (
    <SfLink href={`/storefront/${slug}/products/${product.id}`} className={cn('group block', className)} style={style}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        {product.image && !imageFailed ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            unoptimized
            onError={() => setImageFailed(true)}
            className={`object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 ${soldOut ? 'opacity-60 grayscale' : 'sf-img-in'}`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
            <Package className="h-8 w-8" aria-hidden="true" />
            <span className="text-xs">No image</span>
          </div>
        )}
        {soldOut && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-[#0b1220]">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-3">
        <h3 className="truncate text-sm font-medium underline-offset-4 transition-colors duration-200 group-hover:text-primary group-hover:underline">{product.name}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {lowest ? `${lowest.currency} ${lowest.price.toLocaleString()}` : 'No price set'}
        </p>
      </div>
    </SfLink>
  );
}
