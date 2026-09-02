'use client';

import { use, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storefrontApi } from '@/lib/api/storefront';
import { useThemeStore } from '@/stores/theme.store';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useGuestCartStore } from '@/stores/guest-cart.store';
import { cartApi } from '@/lib/api/cart';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Store, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default function StorefrontLayout({ children, params }: Props) {
  const { slug } = use(params);
  const { loadFromBusiness } = useThemeStore();
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

  useEffect(() => {
    if (info) {
      loadFromBusiness({
        themeColor: info.themeColor,
        name: info.name,
      } as Parameters<typeof loadFromBusiness>[0]);
    }
  }, [info, loadFromBusiness]);

  const logo = info?.logo;
  const themeColor = info?.themeColor ?? '#091426';
  const fallbackLogo = info
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(info.name)}&background=${themeColor.replace('#', '')}&color=fff&size=256&bold=true&format=png`
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
      {/* Glass storefront header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-[#e2e8f0]/60 shadow-[0_1px_3px_0_rgba(9,20,38,0.06)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo + name */}
          <div className="flex items-center gap-3">
            <Link
              href="/businesses"
              className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#091426] transition-colors mr-1"
              title="Back to marketplace"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <Link href={`/storefront/${slug}`} className="flex items-center gap-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-5 w-32" />
                </>
              ) : (
                <>
                  {logo || fallbackLogo ? (
                    <Image
                      src={logo ?? fallbackLogo!}
                      alt={info?.name ?? ''}
                      width={36}
                      height={36}
                      className="rounded-lg object-cover shadow-sm"
                      unoptimized
                    />
                  ) : (
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Store className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <span
                    className="font-bold text-lg text-[#091426]"
                    style={{ fontFamily: 'var(--font-manrope)' }}
                  >
                    {info?.name}
                  </span>
                </>
              )}
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href={`/storefront/${slug}/cart`} className="relative">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center text-[#64748b] hover:text-[#091426] hover:bg-[#eff4ff] transition-colors">
                <ShoppingCart className="h-4.5 w-4.5" />
                {totalItems > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs text-white"
                    style={{ backgroundColor: themeColor }}
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </Badge>
                )}
              </div>
            </Link>
            {!isAuthenticated && (
              <Link
                href="/auth/login"
                className={cn(
                  buttonVariants({ size: 'sm' }),
                  'text-white shadow-sm hover:opacity-90 transition-opacity'
                )}
                style={{ backgroundColor: themeColor }}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Storefront footer */}
      <footer className="bg-[#091426] mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {logo || fallbackLogo ? (
              <Image
                src={logo ?? fallbackLogo!}
                alt={info?.name ?? ''}
                width={28}
                height={28}
                className="rounded-md object-cover"
                unoptimized
              />
            ) : (
              <div
                className="h-7 w-7 rounded-md flex items-center justify-center"
                style={{ backgroundColor: themeColor }}
              >
                <Store className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-manrope)' }}>
              {info?.name ?? slug}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Powered by{' '}
            <Link href="/" className="text-slate-400 hover:text-white transition-colors font-medium">
              Shelflyd
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
