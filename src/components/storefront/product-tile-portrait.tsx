'use client';

import { headlinePrice } from '@/lib/money';
import { PRODUCT_TILE_SIZES, canOptimizeImage } from '@/lib/image';
import Image from 'next/image';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { productImages } from '@/lib/product-images';
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
  // With two or more photos, the second fades in over the cover on hover (never on touch screens) or keyboard focus.
  const second = productImages(product)[1];
  const [secondFailed, setSecondFailed] = useState(false);
  const soldOut = product.status === 'OUT_OF_STOCK';

  return (
    <SfLink href={`/storefront/${slug}/products/${product.id}`} className={cn('group block', className)} style={style}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        {product.image && !imageFailed ? (
          <div className={cn('absolute inset-0', soldOut && 'opacity-60 grayscale')}>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes={PRODUCT_TILE_SIZES}
              unoptimized={!canOptimizeImage(product.image)}
              onError={() => setImageFailed(true)}
              className="sf-img-in object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            />
            {second && !secondFailed && (
              <Image
                src={second}
                alt=""
                aria-hidden="true"
                fill
                sizes={PRODUCT_TILE_SIZES}
                unoptimized={!canOptimizeImage(second)}
                loading="lazy"
                onError={() => setSecondFailed(true)}
                className="object-cover opacity-0 transition-[opacity,scale] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:scale-105"
              />
            )}
          </div>
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
          {headlinePrice(product.prices) ?? 'No price set'}
        </p>
      </div>
    </SfLink>
  );
}
