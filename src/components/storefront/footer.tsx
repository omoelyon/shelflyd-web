'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { readableTextOn } from '@/lib/storefront/design';
import { useStorefront } from './storefront-context';

/** The footer always carries "Powered by Shelflyd"; a design can restyle it but never remove it. */
export default function StorefrontFooter() {
  const { slug, info, design, preview } = useStorefront();
  const light = design.footer.variant === 'light';
  const primary = design.theme.primary;
  const logo = info?.logo;
  const fallbackLogo = info
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(info.name)}&background=${primary.replace('#', '')}&color=fff&size=256&bold=true&format=png`
    : null;
  return (
    <footer className={cn('mt-auto', light ? 'bg-white border-t border-[#e2e8f0]' : 'bg-[#091426]')}>
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {logo || fallbackLogo ? (
            <Image src={logo ?? fallbackLogo!} alt={info?.name ?? ''} width={28} height={28} className="rounded-md object-cover" unoptimized />
          ) : (
            <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ backgroundColor: primary }}>
              <Store className="h-4 w-4" style={{ color: readableTextOn(primary) }} />
            </div>
          )}
          <span
            className={cn('font-bold text-sm', light ? 'text-[#091426]' : 'text-white')}
            style={{ fontFamily: 'var(--sf-heading-font, var(--font-manrope))' }}
          >
            {info?.name ?? slug}
          </span>
        </div>
        <p className={cn('text-xs', light ? 'text-slate-500' : 'text-slate-500')}>
          Powered by{' '}
          <Link
            href="/"
            onClick={(e) => preview && e.preventDefault()}
            className={cn('transition-colors font-medium', light ? 'text-slate-700 hover:text-[#091426]' : 'text-slate-400 hover:text-white')}
          >
            Shelflyd
          </Link>
        </p>
      </div>
    </footer>
  );
}
