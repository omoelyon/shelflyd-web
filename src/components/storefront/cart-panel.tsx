'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn, getApiError } from '@/lib/utils';
import { storefrontApi } from '@/lib/api/storefront';
import { cartApi } from '@/lib/api/cart';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { toCartResponse, useGuestCartStore } from '@/stores/guest-cart.store';
import { cartStockIssue } from '@/lib/cart-stock';
import CartLines from '@/components/features/cart/cart-lines';
import type { CartProduct, CartResponse } from '@/types';

/**
 * One store's cart, for both the full cart page and the slide-in drawer: guest cart or server cart, the same
 * quantity/remove actions, the same checkout rules. Keeping it in one hook means the two can never drift apart.
 */
export function useStorefrontCart(slug: string, enabled = true) {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const setCarts = useCartStore((s) => s.setCarts);
  const removeGuestItem = useGuestCartStore((s) => s.removeItem);
  const decrementGuestItem = useGuestCartStore((s) => s.decrementItem);
  const addGuestItem = useGuestCartStore((s) => s.addItem);

  const { data: info } = useQuery({
    queryKey: ['storefront', slug],
    queryFn: () => storefrontApi.getInfo(slug),
    enabled,
  });

  const guestCart = useGuestCartStore((s) => (info ? s.getCart(info.id) : undefined));

  const { data: allCarts, isLoading } = useQuery({
    queryKey: ['carts'],
    queryFn: cartApi.getAll,
    enabled: enabled && isAuthenticated,
  });

  useEffect(() => {
    if (allCarts) setCarts(allCarts);
  }, [allCarts, setCarts]);

  // Filter cart for this specific business by businessId
  const serverCart = info && allCarts ? allCarts.find((c) => c.businessId === info.id) ?? null : null;
  const cart: CartResponse | null = isAuthenticated ? serverCart : guestCart ? toCartResponse(guestCart) : null;

  const removeProductMutation = useMutation({
    mutationFn: ({ productId, unitId }: { productId: number; unitId: number }) => cartApi.removeProduct(productId, unitId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carts'] });
      toast.success('Item removed.');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to remove item.')),
  });

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

  const onRemove = (product: CartProduct) => {
    if (isAuthenticated) {
      removeProductMutation.mutate({ productId: product.productId, unitId: product.unitId });
    } else if (info) {
      removeGuestItem(info.id, product.productId, product.unitId);
      toast.success('Item removed.');
    }
  };

  const onIncrement = (product: CartProduct) => {
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

  const onDecrement = (product: CartProduct) => {
    if (isAuthenticated) {
      decrementMutation.mutate({ productId: product.productId, unitId: product.unitId });
    } else if (info) {
      decrementGuestItem(info.id, product.productId, product.unitId);
    }
  };

  /** Guests are sent to sign in and come back to the full cart; signed-in shoppers follow the Checkout link instead. */
  const onSignInToCheckout = () => {
    router.push(`/auth/login?from=${encodeURIComponent(`/storefront/${slug}/cart`)}`);
  };

  return {
    info,
    cart,
    isAuthenticated,
    /** True only while a signed-in shopper's server cart is loading. */
    isLoading: isAuthenticated && isLoading,
    isEmpty: !cart || cart.products.length === 0,
    stockIssue: cart ? cartStockIssue(cart) : null,
    onRemove,
    onIncrement,
    onDecrement,
    onSignInToCheckout,
    incrementPending: incrementMutation.isPending,
    decrementPending: decrementMutation.isPending,
    removePending: removeProductMutation.isPending,
  };
}

export type StorefrontCartState = ReturnType<typeof useStorefrontCart>;

/** The cart's lines (sets, quantity steppers, stock notes) — exactly what the cart page has always shown. */
export function CartLinesList({ state }: { state: StorefrontCartState }) {
  if (!state.cart) return null;
  return (
    <CartLines
      cart={state.cart}
      businessName={state.info?.name}
      isAuthenticated={state.isAuthenticated}
      onIncrement={state.onIncrement}
      onDecrement={state.onDecrement}
      onRemove={state.onRemove}
      incrementPending={state.incrementPending}
      decrementPending={state.decrementPending}
      removePending={state.removePending}
    />
  );
}

/** Total on the left, Checkout (or Sign in to Checkout) on the right, with the stock-issue gate. */
export function CartTotalBar({
  state,
  slug,
  onNavigate,
}: {
  state: StorefrontCartState;
  slug: string;
  /** Called when a link is followed (the drawer closes itself). */
  onNavigate?: () => void;
}) {
  const { cart } = state;
  if (!cart) return null;
  const primary = 'bg-primary text-primary-foreground hover:opacity-90';
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Total</p>
        <p className="text-xl font-bold text-primary">₦{cart.totalCost.toLocaleString()}</p>
      </div>
      {state.isAuthenticated ? (
        state.stockIssue ? (
          <Button disabled className={primary}>
            Checkout
          </Button>
        ) : (
          <Link
            href={`/storefront/${slug}/checkout?cartId=${cart.cartId}`}
            onClick={onNavigate}
            className={cn(buttonVariants(), primary)}
          >
            Checkout
          </Link>
        )
      ) : (
        <Button
          onClick={() => {
            onNavigate?.();
            state.onSignInToCheckout();
          }}
          className={primary}
        >
          Sign in to Checkout
        </Button>
      )}
    </div>
  );
}

export function CartStockAlert({ issue }: { issue: string | null }) {
  if (!issue) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {issue}
    </p>
  );
}

/** The seller's short note at the top of the cart (e.g. "Delivery takes 1–2 days"); nothing when empty. */
export function CartMessage({ message, className }: { message: string; className?: string }) {
  const text = message.trim();
  if (!text) return null;
  return (
    <p className={cn('rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground', className)} role="note">
      {text}
    </p>
  );
}
