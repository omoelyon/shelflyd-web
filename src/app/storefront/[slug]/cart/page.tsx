'use client';

import { use } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  CartLinesList,
  CartMessage,
  CartStockAlert,
  CartTotalBar,
  useStorefrontCart,
} from '@/components/storefront/cart-panel';
import { useStorefront } from '@/components/storefront/storefront-context';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function StorefrontCartPage({ params }: Props) {
  const { slug } = use(params);
  const { design } = useStorefront();
  const state = useStorefrontCart(slug);
  const { cart, info } = state;

  if (state.isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    );
  }

  if (!cart || state.isEmpty) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link
          href={`/storefront/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </Link>
        <CartMessage message={design.pages.cart.message} className="mb-6" />
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

      <CartMessage message={design.pages.cart.message} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{info?.name ?? 'Cart'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CartLinesList state={state} />
        </CardContent>
        <CardFooter className="block border-t pt-4">
          <CartTotalBar state={state} slug={slug} />
        </CardFooter>
        {state.stockIssue && (
          <div className="px-6 pb-4">
            <CartStockAlert issue={state.stockIssue} />
          </div>
        )}
      </Card>
    </div>
  );
}
