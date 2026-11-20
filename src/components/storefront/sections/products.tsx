'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Search } from 'lucide-react';
import { storefrontApi } from '@/lib/api/storefront';
import type { ProductsSection } from '@/lib/storefront/design';
import ProductCard from '@/components/features/products/product-card';
import ProductTileCompact from '../product-tile-compact';
import ProductTilePortrait from '../product-tile-portrait';
import SetsEntryRow from '@/components/features/cart-sets/sets-entry-row';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useStorefront } from '../storefront-context';

export default function Products({ section }: { section: ProductsSection }) {
  const { slug, info, preview } = useStorefront();
  const { title, columns, showSearch, showSets } = section.props;
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const { data: productsPage, isLoading: prodLoading } = useQuery({
    queryKey: ['storefront', slug, 'products', page],
    queryFn: () => storefrontApi.getProducts(slug, page, 20),
    enabled: !!slug,
  });

  const filtered = productsPage?.content?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const grid =
    section.variant === 'portrait'
      ? cn('grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8', columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4')
      : section.variant === 'compact'
        ? cn('grid grid-cols-2 md:grid-cols-3 gap-3', columns === 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-5')
        : cn('grid grid-cols-1 sm:grid-cols-2 gap-4', columns === 3 ? 'lg:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4');
  const skeletonHeight = section.variant === 'portrait' ? 'h-80' : section.variant === 'compact' ? 'h-48' : 'h-64';

  return (
    <section aria-label={title || 'Products'} className="max-w-7xl mx-auto px-4 pt-10">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <h2 className="text-xl font-semibold">{title || 'Products'}</h2>
        {showSearch && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              aria-label="Search products"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {showSets && info && <SetsEntryRow businessId={info.id} businessName={info.name} />}

      {prodLoading ? (
        <div className={grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className={cn(skeletonHeight, 'rounded-xl')} />
          ))}
        </div>
      ) : !filtered?.length ? (
        <div className="text-center py-16 space-y-3">
          <Package className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">{search ? 'No products match your search.' : 'No products listed yet.'}</p>
        </div>
      ) : (
        <>
          <div className={grid}>
            {filtered.map((product) =>
              section.variant === 'portrait' ? (
                <ProductTilePortrait key={product.id} product={product} />
              ) : section.variant === 'compact' ? (
                <ProductTileCompact key={product.id} product={product} />
              ) : (
                <ProductCard
                  key={product.id}
                  product={product}
                  href={`/storefront/${slug}/products/${product.id}`}
                  onLinkClick={preview ? (e) => e.preventDefault() : undefined}
                />
              ),
            )}
          </div>

          {productsPage && productsPage.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <Button variant="outline" disabled={productsPage.first} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {productsPage.pageable.pageNumber + 1} of {productsPage.totalPages}
              </span>
              <Button variant="outline" disabled={productsPage.last} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
