'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/lib/api/cart';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useGuestCartStore, toCartResponse } from '@/stores/guest-cart.store';
import { useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { CartResponse } from '@/types';

export default function CartPage() {
  const router = useRouter();
  const { setCarts } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const guestCarts = useGuestCartStore((s) => s.carts);
  const removeGuestItem = useGuestCartStore((s) => s.removeItem);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['carts'],
    queryFn: cartApi.getAll,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (data) setCarts(data);
  }, [data, setCarts]);

  const carts: CartResponse[] = isAuthenticated ? (data ?? []) : guestCarts.map(toCartResponse);

  const removeProductMutation = useMutation({
    mutationFn: (productId: number) => cartApi.removeProduct(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carts'] });
      toast.success('Item removed.');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to remove item.')),
  });

  const handleRemove = (businessId: number, productId: number) => {
    if (isAuthenticated) {
      removeProductMutation.mutate(productId);
    } else {
      removeGuestItem(businessId, productId);
      toast.success('Item removed.');
    }
  };

  const handleCheckoutClick = () => {
    router.push(`/auth/login?from=${encodeURIComponent('/cart')}`);
  };

  if (isAuthenticated && isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Failed to load your cart.</p>
      </div>
    );
  }

  if (!carts.length || carts.every((c) => c.products.length === 0)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center py-24 space-y-4">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <p className="text-muted-foreground">Browse products and add items to your cart.</p>
          <Link href="/products" className={cn(buttonVariants(), 'bg-primary text-primary-foreground hover:opacity-90')}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold">Your Cart</h1>

      {carts.map((cart) => {
        if (cart.products.length === 0) return null;
        return (
          <Card key={cart.businessId}>
            <CardHeader>
              <CardTitle className="text-base">{isAuthenticated ? `Cart #${cart.cartId}` : 'Cart'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.products.map((product) => (
                <div key={product.productId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/40">
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="absolute inset-0 bg-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.unit} · {product.quantity}x · ₦{product.unitPrice.toLocaleString()} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">₦{product.totalPrice.toLocaleString()}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive mt-1"
                      onClick={() => handleRemove(cart.businessId, product.productId)}
                      disabled={removeProductMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-primary">₦{cart.totalCost.toLocaleString()}</p>
              </div>
              {isAuthenticated ? (
                <Link
                  href={`/checkout/${cart.cartId}`}
                  className={cn(buttonVariants(), 'bg-primary text-primary-foreground hover:opacity-90')}
                >
                  Checkout
                </Link>
              ) : (
                <Button
                  onClick={handleCheckoutClick}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  Sign in to Checkout
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
