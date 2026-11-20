'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storefrontApi } from '@/lib/api/storefront';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import ProductDetail from '@/components/storefront/product-detail';

interface Props {
  params: Promise<{ slug: string; productId: string }>;
}

export default function StorefrontProductPage({ params }: Props) {
  const { slug, productId } = use(params);
  const id = Number(productId);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['storefront', slug, 'product', id],
    queryFn: () => storefrontApi.getProduct(slug, id),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
        <Skeleton className="h-96 rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-muted-foreground">Product not found.</p>
        <Link href={`/storefront/${slug}`} className="text-primary hover:underline text-sm">Back to store</Link>
      </div>
    );
  }

  return <ProductDetail product={product} />;
}
