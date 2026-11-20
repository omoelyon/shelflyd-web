'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { storefrontApi } from '@/lib/api/storefront';
import { CartMessage } from './cart-panel';
import { MockCartLines, MockCartTotal } from './mock-cart-view';
import ProductDetail from './product-detail';
import { useStorefront } from './storefront-context';

/**
 * What the editor's live preview shows for the product page and the cart. Both render inside
 * <StorefrontProvider preview> + <StorefrontShell>; they use a sample product and a made-up cart, so nothing
 * here calls a cart API or touches a real cart.
 */

/** The product page, shown with the store's newest product. */
export function ProductPagePreview() {
  const { slug } = useStorefront();
  const { data, isLoading } = useQuery({
    queryKey: ['storefront', slug, 'products', 'preview-sample'],
    queryFn: () => storefrontApi.getProducts(slug, 0, 1),
    enabled: !!slug,
  });
  const product = data?.content?.[0];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-3">
        <Package className="h-12 w-12 text-muted-foreground mx-auto" />
        <p className="font-medium">Add a product to see your product page</p>
        <p className="text-sm text-muted-foreground">Your layout choices apply to every product page once you have products.</p>
      </div>
    );
  }
  return <ProductDetail product={product} />;
}

/** The cart, in the chosen style, filled with sample items. */
export function CartPreview() {
  const { info, design } = useStorefront();
  const { style, message } = design.pages.cart;
  const name = info?.name ?? 'Your store';

  if (style === 'drawer') {
    return (
      <div className="relative min-h-[560px] overflow-hidden" aria-label="Cart drawer preview">
        {/* The store behind the drawer, dimmed. */}
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-10" aria-hidden="true">
          <Skeleton className="h-32 rounded-2xl" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
        <aside className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l bg-background shadow-lg">
          <div className="border-b p-4">
            <p className="text-base font-medium">Your cart</p>
            <p className="text-sm text-muted-foreground">{name}</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <CartMessage message={message} />
            <MockCartLines />
          </div>
          <div className="space-y-3 border-t p-4">
            <MockCartTotal />
            <p className="text-center text-sm font-medium text-primary">View full cart</p>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Continue shopping
      </span>
      <h1 className="text-2xl font-bold">Your Cart</h1>
      <CartMessage message={message} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{name}</CardTitle>
        </CardHeader>
        <CardContent>
          <MockCartLines />
        </CardContent>
        <CardFooter className="block border-t pt-4">
          <MockCartTotal />
        </CardFooter>
      </Card>
    </div>
  );
}
