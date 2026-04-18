'use client';

import { use, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storefrontApi } from '@/lib/api/storefront';
import { useThemeStore } from '@/stores/theme.store';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { cartApi } from '@/lib/api/cart';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default function StorefrontLayout({ children, params }: Props) {
  const { slug } = use(params);
  const { loadFromBusiness } = useThemeStore();
  const { setCarts } = useCartStore();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const { isAuthenticated } = useAuthStore();

  const { data: info, isLoading } = useQuery({
    queryKey: ['storefront', slug],
    queryFn: () => storefrontApi.getInfo(slug),
  });

  // Load cart counts for the badge
  useQuery({
    queryKey: ['carts'],
    queryFn: async () => {
      const data = await cartApi.getAll();
      setCarts(data);
      return data;
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (info) {
      loadFromBusiness({
        themeColor: info.themeColor,
        name: info.name,
      } as Parameters<typeof loadFromBusiness>[0]);
    }
  }, [info, loadFromBusiness]);

  const logo = info?.logo;
  const fallbackLogo = info
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(info.name)}&background=${(info.themeColor ?? '#16a34a').replace('#', '')}&color=fff&size=256&bold=true&format=png`
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Storefront header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            {isLoading ? (
              <Skeleton className="h-9 w-9 rounded-lg" />
            ) : logo || fallbackLogo ? (
              <Image
                src={logo ?? fallbackLogo!}
                alt={info?.name ?? ''}
                width={36}
                height={36}
                className="rounded-lg object-cover"
                unoptimized
              />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            {isLoading ? (
              <Skeleton className="h-5 w-32" />
            ) : (
              <span className="font-bold text-lg text-primary">{info?.name}</span>
            )}
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/cart" className="relative">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:opacity-90"
                asChild
              >
                <Link href="/auth/login">Login to Shop</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Storefront footer */}
      <footer className="border-t border-border bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Powered by{' '}
          <Link href="/" className="text-primary font-medium hover:underline">
            Shelflyd
          </Link>
        </div>
      </footer>
    </div>
  );
}
