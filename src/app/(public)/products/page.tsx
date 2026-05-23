'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import ProductCard from '@/components/features/products/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/ui/empty-state';
import PaginationControls from '@/components/ui/pagination-controls';
import { Search, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category') ?? '';

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', page, categoryParam],
    queryFn: () => productsApi.listAll(page, 15, categoryParam || undefined),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const filtered = data?.content?.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCategoryClick = (name: string) => {
    const next = name === categoryParam ? '' : name;
    setPage(0);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('category', next);
    else params.delete('category');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-[#0058be] uppercase tracking-[0.1em] mb-1">
          Marketplace
        </p>
        <h1 className="text-3xl font-bold text-[#091426] font-heading mb-1">
          {categoryParam || 'All Products'}
        </h1>
        <p className="text-[#64748b] text-sm">
          Browse products from all businesses
          {data && ` · ${data.totalElements} results`}
        </p>
      </div>

      {/* Search + active-category chip */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {categoryParam && (
          <button
            onClick={() => handleCategoryClick(categoryParam)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#091426] text-white text-sm font-medium hover:bg-[#091426]/90 transition-colors self-start"
          >
            {categoryParam}
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category chips */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                categoryParam === cat.name
                  ? 'bg-[#091426] text-white'
                  : 'bg-white text-[#64748b] hover:bg-[#eff4ff] hover:text-[#091426] shadow-card',
              )}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
              <span className="text-[10px] opacity-60">({cat.productCount})</span>
            </button>
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <EmptyState
          icon={Package}
          title="Failed to load products"
          subtitle="Something went wrong. Please try again."
          action={{ label: 'Try again', onClick: () => refetch() }}
        />
      )}

      {/* Results */}
      {!isLoading && !isError && (
        <>
          {!filtered?.length ? (
            <EmptyState
              icon={Package}
              title={
                categoryParam
                  ? `No products in "${categoryParam}"`
                  : 'No products found'
              }
              subtitle={search ? `No results for "${search}".` : undefined}
              action={
                categoryParam
                  ? { label: 'Clear filter', onClick: () => handleCategoryClick(categoryParam) }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <PaginationControls
            page={page}
            totalPages={data?.totalPages ?? 0}
            isFirst={data?.first ?? true}
            isLast={data?.last ?? true}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
            className="mt-10"
          />
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
