'use client';

import { useQuery } from '@tanstack/react-query';
import { use, useEffect } from 'react';
import { businessesApi } from '@/lib/api/businesses';
import { productsApi } from '@/lib/api/products';
import { useThemeStore } from '@/stores/theme.store';
import BusinessAvatar from '@/components/layout/business-avatar';
import ProductCard from '@/components/features/products/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function BusinessStorefrontPage({ params }: Props) {
  const { id } = use(params);
  const businessId = Number(id);
  const loadFromBusiness = useThemeStore((s) => s.loadFromBusiness);

  const { data: businesses, isLoading: bizLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: businessesApi.listAll,
  });

  const business = businesses?.find((b) => b.id === businessId);

  const { data: productsPage, isLoading: prodLoading } = useQuery({
    queryKey: ['products', 'business', businessId],
    queryFn: () => productsApi.listByBusiness(businessId),
    enabled: !!businessId,
  });

  useEffect(() => {
    if (business) loadFromBusiness(business);
  }, [business, loadFromBusiness]);

  if (bizLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Business not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Business Header */}
      <div
        className="rounded-2xl p-8 mb-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start"
        style={{ background: `${business.themeColor ?? '#16a34a'}15` }}
      >
        <BusinessAvatar business={business} size={96} className="rounded-2xl shrink-0" />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start mb-2">
            <h1 className="text-3xl font-bold">{business.name}</h1>
            <Badge
              className="text-white"
              style={{ backgroundColor: business.themeColor ?? '#16a34a' }}
            >
              {business.status}
            </Badge>
          </div>
          {business.description && (
            <p className="text-muted-foreground max-w-xl">{business.description}</p>
          )}
          <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground justify-center sm:justify-start">
            <MapPin className="h-4 w-4" />
            <span>Africa</span>
          </div>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-xl font-semibold mb-6">Products</h2>
      {prodLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : productsPage?.content?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No products listed yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productsPage?.content.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
