'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';

/** When a page crashes: say so plainly, offer to try again (most failures are a dropped connection), and a way home. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f8f9ff] px-4">
      <div className="sf-rise w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-card-md">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fef2f2]">
          <TriangleAlert className="h-7 w-7 text-[#dc2626]" aria-hidden="true" />
        </span>
        <h1 className="font-heading text-2xl font-bold text-[#091426]">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
          This page didn’t load properly. It’s often a weak connection: try again, and if it keeps happening, come back in a little while.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset} className="bg-[#091426] text-white hover:bg-[#091426]/90">
            <RefreshCw />
            Try again
          </Button>
          <Link href="/" className={buttonVariants({ variant: 'outline' })}>
            Go home
          </Link>
        </div>
        {error.digest && <p className="mt-4 text-[11px] text-[#94a3b8]">Reference: {error.digest}</p>}
      </div>
    </main>
  );
}
