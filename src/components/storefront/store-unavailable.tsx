'use client';

import { Store } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { appUrl } from '@/lib/storefront/url';
import { cn } from '@/lib/utils';

/** Shown instead of an empty store when a store link is mistyped, or the store is closed or suspended. */
export default function StoreUnavailable() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-[#f8f9ff] px-4">
      <div className="sf-rise w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-card-md">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff4ff]">
          <Store className="h-7 w-7 text-[#0058be]" aria-hidden="true" />
        </span>
        <h1 className="font-heading text-2xl font-bold text-[#091426]">This store isn’t available</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
          The link may be mistyped, or the store may have closed. You can find other sellers on Shelflyd.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <a href={appUrl('/businesses')} className={cn(buttonVariants(), 'bg-[#091426] text-white hover:bg-[#091426]/90')}>
            Browse stores
          </a>
          <a href={appUrl('/')} className={buttonVariants({ variant: 'outline' })}>
            Go to Shelflyd
          </a>
        </div>
      </div>
    </main>
  );
}
