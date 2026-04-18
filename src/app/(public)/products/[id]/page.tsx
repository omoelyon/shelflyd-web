'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { use } from 'react';
import Image from 'next/image';
import { productsApi } from '@/lib/api/products';
import { cartApi } from '@/lib/api/cart';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params);
  const productId = Number(id);
  const { isAuthenticated } = useAuthStore();
  const updateCart = useCartStore((s) => s.updateCart);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId),
  });

  const addToCart = useMutation({
    mutationFn: () =>
      cartApi.add({ productId, unitId: Number(selectedUnitId), quantity }),
    onSuccess: (cart) => {
      updateCart(cart);
      toast.success('Added to cart!');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to add to cart.')),
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
    return <div className="text-center py-24 text-muted-foreground">Product not found.</div>;
  }

  const selectedPrice = product.prices?.find((p) => p.unitId === Number(selectedUnitId));

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
      {/* Image */}
      <div className="relative h-80 md:h-full min-h-80 bg-muted rounded-2xl overflow-hidden">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline">{product.type}</Badge>
            <Badge
              variant="secondary"
              className={
                product.status === 'AVAILABLE'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }
            >
              {product.status.replace('_', ' ')}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          {product.description && (
            <p className="text-muted-foreground mt-2">{product.description}</p>
          )}
        </div>

        {/* Pricing */}
        {product.prices?.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Unit</label>
            <Select value={selectedUnitId} onValueChange={(v) => setSelectedUnitId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a unit..." />
              </SelectTrigger>
              <SelectContent>
                {product.prices.map((p) => (
                  <SelectItem key={p.unitId} value={String(p.unitId)}>
                    Unit #{p.unitId} — {p.currency} {p.price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPrice && (
              <p className="text-2xl font-bold text-primary">
                {selectedPrice.currency} {selectedPrice.price.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Quantity */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Qty:</label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              -
            </Button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <Button variant="outline" size="icon" onClick={() => setQuantity((q) => q + 1)}>
              +
            </Button>
          </div>
        </div>

        {/* Add to cart */}
        {isAuthenticated ? (
          <Button
            className="w-full bg-primary text-primary-foreground hover:opacity-90"
            size="lg"
            disabled={!selectedUnitId || product.status !== 'AVAILABLE' || addToCart.isPending}
            onClick={() => addToCart.mutate()}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
          </Button>
        ) : (
          <Button variant="outline" size="lg" className="w-full" asChild>
            <a href="/auth/login">Login to Add to Cart</a>
          </Button>
        )}
      </div>
    </div>
  );
}
