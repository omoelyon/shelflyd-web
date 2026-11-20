'use client';

import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { readableTextOn } from '@/lib/storefront/design';
import { useCartDrawer } from './cart-drawer-store';
import { SfLink } from './sf-link';
import { useActivePage, useNavPages, useStorefront } from './storefront-context';

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
  const { slug, design, preview } = useStorefront();
  const primary = design.theme.primary;
  const inner = (
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
  );
  // With the drawer style the cart slides in over the page instead of opening the cart page.
  if (design.pages.cart.style === 'drawer' && !preview) {
    return (
      <button
        type="button"
        className="relative rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Open cart"
        aria-haspopup="dialog"
        onClick={() => useCartDrawer.getState().setOpen(true)}
      >
        {inner}
      </button>
    );
  }
  return (
    <SfLink href={`/storefront/${slug}/cart`} className="relative" aria-label="Cart">
      {inner}
    </SfLink>
  );
}

/** Home plus the seller's extra pages. Renders nothing when there are none, so the header stays exactly as it was. */
function NavLinks({ className, listClassName }: { className?: string; listClassName?: string }) {
  const links = useNavPages();
  const active = useActivePage();
  if (links.length === 0) return null;
  return (
    <nav aria-label="Pages" className={className}>
      <ul className={cn('flex items-center gap-1 overflow-x-auto', listClassName)}>
        {links.map((l) => (
          <li key={l.key} className="shrink-0">
            <SfLink
              href={l.href}
              aria-current={active === l.key ? 'page' : undefined}
              className="block whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium text-[#64748b] outline-none transition-colors hover:text-[#091426] focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-primary/10 aria-[current=page]:text-[#091426]"
            >
              {l.label}
            </SfLink>
          </li>
        ))}
      </ul>
    </nav>
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
        <NavLinks className="max-w-7xl mx-auto px-4 pb-1.5" listClassName="mx-auto w-max max-w-full" />
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
          <NavLinks className="ml-3 hidden md:block" />
        </div>
        <div className="flex items-center gap-3">
          <CartLink totalItems={totalItems} />
          {!isAuthenticated && <LoginLink />}
        </div>
      </div>
      <NavLinks className="max-w-7xl mx-auto px-4 pb-1.5 md:hidden" />
    </header>
  );
}
