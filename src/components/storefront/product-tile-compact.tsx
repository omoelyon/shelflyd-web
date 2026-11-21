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

const STATUS_DOT: Partial<Record<Product['status'], { label: string; dot: string }>> = {
  LOW_STOCK: { label: 'Low stock', dot: 'bg-orange-500' },
  OUT_OF_STOCK: { label: 'Sold out', dot: 'bg-red-500' },
  COMING_SOON: { label: 'Coming soon', dot: 'bg-blue-500' },
};

/** The "compact" product look: a small, dense card so a big catalogue stays scannable. */
export default function ProductTileCompact({ product, className, style }: { product: Product; className?: string; style?: CSSProperties }) {
  const { slug } = useStorefront();
  const [imageFailed, setImageFailed] = useState(false);
  // With two or more photos, the second fades in over the cover on hover (never on touch screens) or keyboard focus.
  const second = productImages(product)[1];
  const [secondFailed, setSecondFailed] = useState(false);
  const status = STATUS_DOT[product.status];
  const soldOut = product.status === 'OUT_OF_STOCK';

  return (
    <SfLink href={`/storefront/${slug}/products/${product.id}`} className={cn('group block h-full', className)} style={style}>
      <div className="sf-lift flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.image && !imageFailed ? (
            <div className={cn('absolute inset-0', soldOut && 'opacity-50 grayscale')}>
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes={PRODUCT_TILE_SIZES}
                unoptimized={!canOptimizeImage(product.image)}
                onError={() => setImageFailed(true)}
                className="sf-img-in object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
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
                  className="object-cover opacity-0 transition-[opacity,scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:scale-105"
                />
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
              <Package className="h-6 w-6" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-2.5">
          <h3 className="line-clamp-2 text-xs font-medium leading-snug transition-colors duration-200 group-hover:text-primary">{product.name}</h3>
          <div className="mt-auto pt-1.5">
            <p className="text-xs font-semibold text-primary">
              {headlinePrice(product.prices) ?? 'No price set'}
            </p>
            {status && (
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
                {status.label}
              </p>
            )}
          </div>
        </div>
      </div>
    </SfLink>
  );
}
