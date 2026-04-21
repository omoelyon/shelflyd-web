'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import ProductCard from '@/components/features/products/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, X } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category') ?? '';

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(categoryParam);

  // Reset page when category changes
  useEffect(() => {
    setActiveCategory(categoryParam);
    setPage(0);
  }, [categoryParam]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', page, activeCategory],
    queryFn: () => productsApi.listAll(page, 15, activeCategory || undefined),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const filtered = data?.content?.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCategoryClick = (name: string) => {
    const next = name === activeCategory ? '' : name;
    setActiveCategory(next);
    setPage(0);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('category', next);
    else params.delete('category');
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-[#0058be] uppercase tracking-[0.1em] mb-1">Marketplace</p>
        <h1
          className="text-3xl font-bold text-[#091426] mb-1"
          style={{ fontFamily: 'var(--font-manrope)' }}
        >
          {activeCategory ? activeCategory : 'All Products'}
        </h1>
        <p className="text-[#64748b] text-sm">
          Browse products from all businesses
          {data && ` · ${data.totalElements} results`}
        </p>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {activeCategory && (
          <button
            onClick={() => handleCategoryClick(activeCategory)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#091426] text-white text-sm font-medium hover:bg-[#091426]/90 transition-colors self-start"
          >
            {activeCategory} <X className="h-3.5 w-3.5" />
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.name
                  ? 'bg-[#091426] text-white'
                  : 'bg-white text-[#64748b] hover:bg-[#eff4ff] hover:text-[#091426] shadow-sm'
              }`}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
              <span className="text-[10px] opacity-60">({cat.productCount})</span>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-16">
          <p className="text-[#64748b] mb-4">Failed to load products.</p>
          <button onClick={() => refetch()} className="text-[#0058be] underline text-sm">Try again</button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {!filtered?.length ? (
            <div className="text-center py-16 space-y-3">
              <Package className="h-12 w-12 text-[#cbd5e1] mx-auto" />
              <p className="text-[#64748b]">No products found{activeCategory ? ` in "${activeCategory}"` : ''}.</p>
              {activeCategory && (
                <button
                  onClick={() => handleCategoryClick(activeCategory)}
                  className="text-[#0058be] text-sm underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <Button variant="outline" disabled={data.first} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-[#64748b]">
                Page {data.pageable.pageNumber + 1} of {data.totalPages}
              </span>
              <Button variant="outline" disabled={data.last} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
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
