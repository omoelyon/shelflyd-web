'use client';

import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { readableTextOn } from '@/lib/storefront/design';
import { SfLink } from './sf-link';
import { useStorefront } from './storefront-context';

interface HeaderProps {
  totalItems: number;
  isAuthenticated: boolean;
}

/** The logo (or a generated one) and the business name, shared by the header variants. */
function Brand() {
  const { slug, info, isLoading, design } = useStorefront();
  const primary = design.theme.primary;
  const logo = info?.logo;
  const fallbackLogo = info
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(info.name)}&background=${primary.replace('#', '')}&color=fff&size=256&bold=true&format=png`
    : null;
  return (
    <SfLink href={`/storefront/${slug}`} className="flex min-w-0 items-center gap-3">
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
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: primary }}>
              <Store className="h-5 w-5" style={{ color: readableTextOn(primary) }} />
            </div>
          )}
          <span className="truncate whitespace-nowrap font-bold text-lg text-[#091426]" style={{ fontFamily: 'var(--sf-heading-font, var(--font-manrope))' }}>
            {info?.name}
          </span>
        </>
      )}
    </SfLink>
  );
}

function CartLink({ totalItems }: { totalItems: number }) {
  const { slug, design } = useStorefront();
  const primary = design.theme.primary;
  return (
    <SfLink href={`/storefront/${slug}/cart`} className="relative" aria-label="Cart">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center text-[#64748b] hover:text-[#091426] hover:bg-[#eff4ff] transition-colors">
        <ShoppingCart className="h-4.5 w-4.5" />
        {totalItems > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            style={{ backgroundColor: primary, color: readableTextOn(primary) }}
          >
            {totalItems > 9 ? '9+' : totalItems}
          </Badge>
        )}
      </div>
    </SfLink>
  );
}

function LoginLink() {
  const { design } = useStorefront();
  const primary = design.theme.primary;
  return (
    <SfLink
      href="/auth/login"
      className={cn(buttonVariants({ size: 'sm' }), 'shadow-sm hover:opacity-90 transition-opacity')}
      style={{ backgroundColor: primary, color: readableTextOn(primary) }}
    >
      Login
    </SfLink>
  );
}

export default function StorefrontHeader({ totalItems, isAuthenticated }: HeaderProps) {
  const { design } = useStorefront();
  const { variant, sticky } = design.header;
  const bar = cn(
    'z-50 bg-white/85 backdrop-blur-xl border-b border-[#e2e8f0]/60 shadow-[0_1px_3px_0_rgba(9,20,38,0.06)]',
    sticky && 'sticky top-0',
  );

  if (variant === 'centered') {
    return (
      <header className={bar}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr]">
          <div aria-hidden="true" className="hidden sm:block" />
          <Brand />
          <div className="flex shrink-0 items-center justify-end gap-3">
            <CartLink totalItems={totalItems} />
            {!isAuthenticated && <LoginLink />}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={bar}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SfLink
            href="/businesses"
            className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#091426] transition-colors mr-1"
            title="Back to marketplace"
            aria-label="Back to marketplace"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </SfLink>
          <Brand />
        </div>
        <div className="flex items-center gap-3">
          <CartLink totalItems={totalItems} />
          {!isAuthenticated && <LoginLink />}
        </div>
      </div>
    </header>
  );
}
