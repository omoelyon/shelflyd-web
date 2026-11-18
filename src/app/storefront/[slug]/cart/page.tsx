'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storefrontApi } from '@/lib/api/storefront';
import { cartApi } from '@/lib/api/cart';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useGuestCartStore, toCartResponse } from '@/stores/guest-cart.store';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import type { CartProduct } from '@/types';
import CartLines from '@/components/features/cart/cart-lines';
import { cartStockIssue } from '@/lib/cart-stock';
import Link from 'next/link';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function StorefrontCartPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const { setCarts } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const removeGuestItem = useGuestCartStore((s) => s.removeItem);
  const decrementGuestItem = useGuestCartStore((s) => s.decrementItem);
  const addGuestItem = useGuestCartStore((s) => s.addItem);
  const qc = useQueryClient();

  const { data: info } = useQuery({
    queryKey: ['storefront', slug],
    queryFn: () => storefrontApi.getInfo(slug),
  });

  const guestCart = useGuestCartStore((s) => (info ? s.getCart(info.id) : undefined));

  const { data: allCarts, isLoading } = useQuery({
    queryKey: ['carts'],
    queryFn: cartApi.getAll,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (allCarts) setCarts(allCarts);
  }, [allCarts, setCarts]);

  // Filter cart for this specific business by businessId
  const serverCart = info && allCarts
    ? allCarts.find((c) => c.businessId === info.id) ?? null
    : null;

  const businessCart = isAuthenticated
    ? serverCart
    : guestCart
      ? toCartResponse(guestCart)
      : null;

  const removeProductMutation = useMutation({
    mutationFn: ({ productId, unitId }: { productId: number; unitId: number }) =>
      cartApi.removeProduct(productId, unitId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carts'] });
      toast.success('Item removed.');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to remove item.')),
  });

  const handleRemove = (productId: number, unitId: number) => {
    if (isAuthenticated) {
      removeProductMutation.mutate({ productId, unitId });
    } else if (info) {
      removeGuestItem(info.id, productId, unitId);
      toast.success('Item removed.');
    }
  };

  // SHF-13: same delta-based stepper as the multi-business cart page.
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

  const handleIncrement = (product: CartProduct) => {
    if (isAuthenticated) {
      incrementMutation.mutate({ productId: product.productId, unitId: product.unitId });
    } else if (info) {
      addGuestItem(info.id, {
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

  const handleDecrement = (productId: number, unitId: number) => {
    if (isAuthenticated) {
      decrementMutation.mutate({ productId, unitId });
    } else if (info) {
      decrementGuestItem(info.id, productId, unitId);
    }
  };

  const handleCheckoutClick = () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?from=${encodeURIComponent(`/storefront/${slug}/cart`)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    );
  }

  if (!businessCart || businessCart.products.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link
          href={`/storefront/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </Link>
        <div className="text-center py-16 space-y-4">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <Link href={`/storefront/${slug}`} className={cn(buttonVariants(), 'bg-primary text-primary-foreground hover:opacity-90')}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <Link
        href={`/storefront/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Continue shopping
      </Link>

      <h1 className="text-2xl font-bold">Your Cart</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{info?.name ?? 'Cart'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CartLines
            cart={businessCart}
            businessName={info?.name}
            isAuthenticated={isAuthenticated}
            onIncrement={handleIncrement}
            onDecrement={(product) => handleDecrement(product.productId, product.unitId)}
            onRemove={(product) => handleRemove(product.productId, product.unitId)}
            incrementPending={incrementMutation.isPending}
            decrementPending={decrementMutation.isPending}
            removePending={removeProductMutation.isPending}
          />
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-4">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-primary">₦{businessCart.totalCost.toLocaleString()}</p>
          </div>
          {isAuthenticated ? (
            cartStockIssue(businessCart) ? (
              <Button disabled className="bg-primary text-primary-foreground">Checkout</Button>
            ) : (
              <Link
                href={`/storefront/${slug}/checkout?cartId=${businessCart.cartId}`}
                className={cn(buttonVariants(), 'bg-primary text-primary-foreground hover:opacity-90')}
              >
                Checkout
              </Link>
            )
          ) : (
            <Button
              onClick={handleCheckoutClick}
              className="bg-primary text-primary-foreground hover:opacity-90"
            >
              Sign in to Checkout
            </Button>
          )}
        </CardFooter>
        {cartStockIssue(businessCart) && (
          <p role="alert" className="px-6 pb-4 text-xs font-medium text-destructive">{cartStockIssue(businessCart)}</p>
        )}
      </Card>
    </div>
  );
}
