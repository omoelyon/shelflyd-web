'use client';

import ProductCard from '@/components/features/products/product-card';
import { cn } from '@/lib/utils';
import type { CSSProperties } from 'react';
import type { Product } from '@/types';
import ProductTileCompact from '../product-tile-compact';
import ProductTilePortrait from '../product-tile-portrait';
import { useStorefront } from '../storefront-context';

export type ProductLook = 'grid' | 'portrait' | 'compact';

/** The responsive grid classes for a product look and column setting (shared by Products and Featured). */
export function productGridClass(look: ProductLook, columns: 3 | 4): string {
  if (look === 'portrait') return cn('grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8', columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4');
  if (look === 'compact') return cn('grid grid-cols-2 md:grid-cols-3 gap-3', columns === 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-5');
  // Two columns even on phones, so a shopper sees several products per screen instead of half of one.
  return cn('grid grid-cols-2 gap-3 sm:gap-4', columns === 3 ? 'lg:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4');
}

export const productSkeletonHeight = (look: ProductLook) => (look === 'portrait' ? 'h-80' : look === 'compact' ? 'h-48' : 'h-64');

/**
 * One product in the chosen look, linking to its storefront page (inert in the editor preview). `index` is its
 * position in the grid: tiles rise in one after another, and since the list is keyed by product id, only tiles
 * that are new to the screen (a category change, a search, the next page) play the entrance.
 */
export function ProductTile({ product, look, index = 0 }: { product: Product; look: ProductLook; index?: number }) {
  const { slug, preview } = useStorefront();
  const motion = { className: 'sf-rise', style: { '--sf-i': index } as CSSProperties };
  if (look === 'portrait') return <ProductTilePortrait product={product} {...motion} />;
  if (look === 'compact') return <ProductTileCompact product={product} {...motion} />;
  return (
    <ProductCard
      product={product}
      href={`/storefront/${slug}/products/${product.id}`}
      onLinkClick={preview ? (e) => e.preventDefault() : undefined}
      {...motion}
    />
  );
}
