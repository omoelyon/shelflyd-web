'use client';

import { useQuery } from '@tanstack/react-query';
import { storefrontApi } from '@/lib/api/storefront';
import type { FeaturedSection } from '@/lib/storefront/design';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useStorefront } from '../storefront-context';
import { ProductTile, productGridClass, productSkeletonHeight } from './product-grid';

/** A hand-picked set of products, shown in the same looks as the main products section. */
export default function Featured({ section }: { section: FeaturedSection }) {
  const { slug } = useStorefront();
  const { title, productIds, columns } = section.props;
  const { data: products, isLoading } = useQuery({
    queryKey: ['storefront', slug, 'featured', productIds.join(',')],
    queryFn: () => storefrontApi.getFeatured(slug, productIds),
    enabled: !!slug && productIds.length > 0,
  });

  if (productIds.length === 0) return null;
  if (!isLoading && !products?.length) return null; // everything picked was removed or sold elsewhere

  const grid = productGridClass(section.variant, columns);
  return (
    <section aria-label={title || 'Featured products'} className="max-w-7xl mx-auto px-4 pt-10">
      {title.trim() && <h2 className="mb-6 text-xl font-semibold">{title}</h2>}
      {isLoading ? (
        <div className={grid}>
          {productIds.slice(0, 8).map((id) => (
            <Skeleton key={id} className={cn(productSkeletonHeight(section.variant), 'rounded-xl')} />
          ))}
        </div>
      ) : (
        <div className={grid}>
          {products!.map((product, i) => (
            <ProductTile key={product.id} product={product} look={section.variant} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
