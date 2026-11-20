'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCartDrawer } from './cart-drawer-store';
import { CartLinesList, CartMessage, CartStockAlert, CartTotalBar, useStorefrontCart } from './cart-panel';
import { useStorefront } from './storefront-context';

/**
 * The slide-in cart used when the design's cart style is "drawer". It is mounted once by StorefrontShell, opens
 * through `useCartDrawer()` (the header cart icon, and after a successful add to cart) and renders nothing when
 * the style is "page". It shows the same cart, with the same actions and checkout rules, as the full cart page.
 */
export default function CartDrawer() {
  const { slug, design, preview } = useStorefront();
  const isDrawer = design.pages.cart.style === 'drawer' && !preview;
  const open = useCartDrawer((s) => s.open);
  const setOpen = useCartDrawer((s) => s.setOpen);

  // Close when the shopper navigates (including to checkout or sign-in), and never leave it open on a design
  // that no longer uses the drawer.
  const pathname = usePathname();
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      useCartDrawer.getState().setOpen(false);
    }
  }, [pathname]);

  if (!isDrawer) return null;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <DrawerBody slug={slug} close={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

/** Only mounted while the drawer is open, so the cart queries do not run on every page view. */
function DrawerBody({ slug, close }: { slug: string; close: () => void }) {
  const { design } = useStorefront();
  const state = useStorefrontCart(slug);
  const { cart, info } = state;
  const fullCart = `/storefront/${slug}/cart`;

  return (
    <>
      <SheetHeader className="border-b p-4 pr-12">
        <SheetTitle className="text-base">Your cart</SheetTitle>
        <SheetDescription>{info?.name ?? 'Your order'}</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <CartMessage message={design.pages.cart.message} />
        {state.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : !cart || state.isEmpty ? (
          <div className="space-y-4 py-12 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="font-semibold">Your cart is empty</p>
            <Link
              href={`/storefront/${slug}`}
              onClick={close}
              className={cn(buttonVariants(), 'bg-primary text-primary-foreground hover:opacity-90')}
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <CartLinesList state={state} />
        )}
      </div>

      {cart && !state.isEmpty && (
        <div className="space-y-3 border-t p-4">
          <CartStockAlert issue={state.stockIssue} />
          <CartTotalBar state={state} slug={slug} onNavigate={close} />
          <Link href={fullCart} onClick={close} className="block text-center text-sm font-medium text-primary hover:underline">
            View full cart
          </Link>
        </div>
      )}
    </>
  );
}
