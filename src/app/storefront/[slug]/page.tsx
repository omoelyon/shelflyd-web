'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storefrontApi } from '@/lib/api/storefront';
import ProductCard from '@/components/features/products/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Package } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function StorefrontHomePage({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const { data: info, isLoading: infoLoading } = useQuery({
    queryKey: ['storefront', slug],
    queryFn: () => storefrontApi.getInfo(slug),
  });

  const { data: productsPage, isLoading: prodLoading } = useQuery({
    queryKey: ['storefront', slug, 'products', page],
    queryFn: () => storefrontApi.getProducts(slug, page, 20),
    enabled: !!slug,
  });

  const filtered = productsPage?.content?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Business hero */}
      {infoLoading ? (
        <Skeleton className="h-40 rounded-2xl mb-10" />
      ) : info ? (
        <div
          className="rounded-2xl p-8 mb-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start"
          style={{ background: `${info.themeColor ?? '#16a34a'}15` }}
        >
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start mb-2">
              <h1 className="text-3xl font-bold">{info.name}</h1>
              <Badge
                className="text-white"
                style={{ backgroundColor: info.themeColor ?? '#16a34a' }}
              >
                Open
              </Badge>
            </div>
            {info.description && (
              <p className="text-muted-foreground max-w-xl">{info.description}</p>
            )}
            <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground justify-center sm:justify-start">
              <MapPin className="h-4 w-4" />
              <span>Africa</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Products */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <h2 className="text-xl font-semibold">Products</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {prodLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : !filtered?.length ? (
        <div className="text-center py-16 space-y-3">
          <Package className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">
            {search ? 'No products match your search.' : 'No products listed yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {productsPage && productsPage.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <Button
                variant="outline"
                disabled={productsPage.first}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {productsPage.pageable.pageNumber + 1} of {productsPage.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={productsPage.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
