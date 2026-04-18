'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Package } from 'lucide-react';

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  OUT_OF_STOCK: 'bg-red-100 text-red-700',
  DISCONTINUED: 'bg-gray-100 text-gray-700',
};

export default function AdminProductsPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: () => productsApi.adminListAll(page, 20),
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">All Products</h1>
        <p className="text-muted-foreground text-sm">{data?.totalElements ?? 0} total products</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : data?.content?.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Package className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No products found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.content.map((product) => (
                <div key={product.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-white">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground absolute inset-0 m-auto" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Business #{product.businessId} · {product.type || 'N/A'}
                    </p>
                  </div>
                  <Badge variant="secondary" className={statusColors[product.status]}>
                    {product.status.replace('_', ' ')}
                  </Badge>
                  {product.prices?.length > 0 && (
                    <p className="text-sm font-semibold text-primary shrink-0">
                      {product.prices[0].currency} {product.prices[0].price.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" disabled={data.first} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pageable.pageNumber + 1} of {data.totalPages}
          </span>
          <Button variant="outline" disabled={data.last} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
