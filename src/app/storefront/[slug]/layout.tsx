'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storefrontApi } from '@/lib/api/storefront';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useGuestCartStore } from '@/stores/guest-cart.store';
import { cartApi } from '@/lib/api/cart';
import { StorefrontProvider } from '@/components/storefront/storefront-context';
import StorefrontShell from '@/components/storefront/shell';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default function StorefrontLayout({ children, params }: Props) {
  const { slug } = use(params);
  const { setCarts } = useCartStore();
  const serverTotalItems = useCartStore((s) => s.getTotalItems());
  const guestTotalItems = useGuestCartStore((s) => s.getTotalItems());
  const { isAuthenticated } = useAuthStore();
  const totalItems = isAuthenticated ? serverTotalItems : guestTotalItems;

  const { data: info, isLoading } = useQuery({
    queryKey: ['storefront', slug],
    queryFn: () => storefrontApi.getInfo(slug),
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
      <StorefrontShell totalItems={totalItems} isAuthenticated={isAuthenticated}>
        {children}
      </StorefrontShell>
    </StorefrontProvider>
  );
}
