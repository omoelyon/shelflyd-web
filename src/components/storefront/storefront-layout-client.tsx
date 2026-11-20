'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storefrontApi } from '@/lib/api/storefront';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useGuestCartStore } from '@/stores/guest-cart.store';
import { cartApi } from '@/lib/api/cart';
import { StorefrontProvider, readPreviewToken } from '@/components/storefront/storefront-context';
import StorefrontShell from '@/components/storefront/shell';
import { useHydrated } from '@/components/storefront/use-hydrated';

interface Props {
  slug: string;
  children: React.ReactNode;
}

/**
 * The storefront's client side: loads the store, keeps the shopper's cart in step and wraps every storefront page in
 * the themed shell. (The server-side `layout.tsx` around it only provides the page metadata.)
 */
export default function StorefrontLayoutClient({ slug, children }: Props) {
  const { setCarts } = useCartStore();
  const serverTotalItems = useCartStore((s) => s.getTotalItems());
  const guestTotalItems = useGuestCartStore((s) => s.getTotalItems());
  const { isAuthenticated } = useAuthStore();
  // Saved carts and the signed-in hint only exist in the browser, so the server and the first client render both show "none" and the real values appear right after hydration (no mismatch, no flicker).
  const hydrated = useHydrated();
  const totalItems = hydrated ? (isAuthenticated ? serverTotalItems : guestTotalItems) : 0;

  // A private draft-preview link carries ?preview=<token>; it is read once and remembered for the session.
  const [previewToken] = useState(() => readPreviewToken(slug));

  const { data: info, isLoading } = useQuery({
    queryKey: ['storefront', slug, previewToken],
    queryFn: () => storefrontApi.getInfo(slug, previewToken),
  });

  useQuery({
    queryKey: ['carts'],
    queryFn: async () => {
      const data = await cartApi.getAll();
      setCarts(data);
      return data;
    },
    enabled: isAuthenticated,
  });

  return (
    <StorefrontProvider slug={slug} info={info} isLoading={isLoading}>
      <StorefrontShell totalItems={totalItems} isAuthenticated={hydrated && isAuthenticated}>
        {children}
      </StorefrontShell>
    </StorefrontProvider>
  );
}
