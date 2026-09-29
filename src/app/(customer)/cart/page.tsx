'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/lib/api/cart';
import { businessesApi } from '@/lib/api/businesses';
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
import { ShoppingCart, Trash2, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BusinessAvatar from '@/components/layout/business-avatar';
import type { CartResponse } from '@/types';

export default function CartPage() {
  const router = useRouter();
  const { setCarts } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const guestCarts = useGuestCartStore((s) => s.carts);
  const removeGuestItem = useGuestCartStore((s) => s.removeItem);
  const decrementGuestItem = useGuestCartStore((s) => s.decrementItem);
  const addGuestItem = useGuestCartStore((s) => s.addItem);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['carts'],
    queryFn: cartApi.getAll,
    enabled: isAuthenticated,
  });

  // SHF-12: cart cards only ever showed "Cart #7", with no way to tell whose store that
  // was — a shopper buying from multiple businesses at once couldn't tell the cards apart.
  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: businessesApi.listAll,
  });
  const businessById = new Map((businesses ?? []).map((b) => [b.id, b]));

  useEffect(() => {
    if (data) setCarts(data);
  }, [data, setCarts]);

  const carts: CartResponse[] = isAuthenticated ? (data ?? []) : guestCarts.map(toCartResponse);

  const removeProductMutation = useMutation({
    mutationFn: ({ productId, unitId }: { productId: number; unitId: number }) =>
      cartApi.removeProduct(productId, unitId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carts'] });
      toast.success('Item removed.');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to remove item.')),
  });

  // SHF-13: quantity stepper — +1 reuses the same add endpoint as the product page,
  // -1 the same subtract endpoint used elsewhere, so the backend's own dedupe/line-item
  // math stays the single source of truth instead of duplicating it client-side.
  const incrementMutation = useMutation({
    mutationFn: (data: { productId: number; unitId: number }) => cartApi.add({ ...data, quantity: 1 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['carts'] }),
    onError: (error) => toast.error(getApiError(error, 'Could not update quantity.')),
  });

  const decrementMutation = useMutation({
    mutationFn: (data: { productId: number; unitId: number }) => cartApi.remove({ ...data, quantity: 1 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['carts'] }),
    onError: (error) => toast.error(getApiError(error, 'Could not update quantity.')),
  });

  const handleRemove = (businessId: number, productId: number, unitId: number) => {
    if (isAuthenticated) {
      removeProductMutation.mutate({ productId, unitId });
    } else {
      removeGuestItem(businessId, productId, unitId);
      toast.success('Item removed.');
    }
  };

  const handleIncrement = (businessId: number, product: CartResponse['products'][number]) => {
    if (isAuthenticated) {
      incrementMutation.mutate({ productId: product.productId, unitId: product.unitId });
    } else {
      addGuestItem(businessId, {
        productId: product.productId,
        unitId: product.unitId,
        quantity: 1,
        name: product.name,
        type: product.type,
        image: product.image,
        unit: product.unit,
        unitPrice: product.unitPrice,
        note: product.note,
      });
    }
  };

  const handleDecrement = (businessId: number, productId: number, unitId: number) => {
    if (isAuthenticated) {
      decrementMutation.mutate({ productId, unitId });
    } else {
      decrementGuestItem(businessId, productId, unitId);
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
        const business = businessById.get(cart.businessId);
        return (
          <Card key={cart.businessId}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2.5">
                {business && <BusinessAvatar business={business} size={28} />}
                {business?.name ?? (isAuthenticated ? `Cart #${cart.cartId}` : 'Cart')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.products.map((product) => (
                <div key={`${product.productId}-${product.unitId}`} className="flex items-center gap-4 p-3 rounded-lg bg-muted/40">
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
                    {product.note && (
                      <p className="text-xs italic text-muted-foreground mt-0.5">Note: {product.note}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-primary">₦{product.totalPrice.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1.5 justify-end">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDecrement(cart.businessId, product.productId, product.unitId)}
                        disabled={isAuthenticated && decrementMutation.isPending}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium tabular-nums">{product.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleIncrement(cart.businessId, product)}
                        disabled={isAuthenticated && incrementMutation.isPending}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive ml-1"
                        onClick={() => handleRemove(cart.businessId, product.productId, product.unitId)}
                        disabled={removeProductMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
