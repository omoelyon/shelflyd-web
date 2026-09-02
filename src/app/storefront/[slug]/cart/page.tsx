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
import { ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function StorefrontCartPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const { setCarts } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const removeGuestItem = useGuestCartStore((s) => s.removeItem);
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
    mutationFn: (productId: number) => cartApi.removeProduct(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carts'] });
      toast.success('Item removed.');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to remove item.')),
  });

  const handleRemove = (productId: number) => {
    if (isAuthenticated) {
      removeProductMutation.mutate(productId);
    } else if (info) {
      removeGuestItem(info.id, productId);
      toast.success('Item removed.');
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
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </Link>
        <div className="text-center py-16 space-y-4">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <Link href="/" className={cn(buttonVariants(), 'bg-primary text-primary-foreground hover:opacity-90')}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <Link
        href="/"
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
          {businessCart.products.map((product) => (
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
              <div className="text-right shrink-0">
                <p className="font-semibold text-primary">₦{product.totalPrice.toLocaleString()}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive mt-1"
                  onClick={() => handleRemove(product.productId)}
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
            <p className="text-xl font-bold text-primary">₦{businessCart.totalCost.toLocaleString()}</p>
          </div>
          {isAuthenticated ? (
            <Link
              href={`/storefront/${slug}/checkout?cartId=${businessCart.cartId}`}
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
    </div>
  );
}
