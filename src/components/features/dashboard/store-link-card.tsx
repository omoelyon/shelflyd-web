'use client';

import Link from 'next/link';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function StoreLinkCardSkeleton() {
  return <Skeleton className="h-28 rounded-2xl" />;
}

/** The public link a seller shares with customers, with copy and open actions. */
export default function StoreLinkCard({ slug }: { slug: string }) {
  const path = `/storefront/${slug}`;

  const copy = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error("Couldn't copy the link. Select it and copy manually.");
    }
  };

  return (
    <section aria-labelledby="store-link-heading" className="bg-white rounded-2xl shadow-card-md p-5">
      <h2 id="store-link-heading" className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
        Your store link
      </h2>
      <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#f1f5f9] px-3 py-2.5">
        <p className="flex-1 min-w-0 truncate text-sm font-medium text-[#091426]">
          shelflyd.com{path}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={copy}
          aria-label="Copy store link"
          className="shrink-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <Link
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3 h-8 gap-1.5 text-xs')}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        View store
      </Link>
    </section>
  );
}
