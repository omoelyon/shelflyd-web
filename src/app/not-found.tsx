import Link from 'next/link';
import { Compass } from 'lucide-react';

export const metadata = { title: 'Page not found · Shelflyd' };

// Plain classes (this page renders on the server, where the client-side button helper can't be called).
const primary =
  'inline-flex h-9 items-center justify-center rounded-lg bg-[#091426] px-4 text-sm font-medium text-white transition-colors hover:bg-[#091426]/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0058be]/40';
const secondary =
  'inline-flex h-9 items-center justify-center rounded-lg border border-[rgba(9,20,38,0.12)] bg-white px-4 text-sm font-medium text-[#091426] transition-colors hover:bg-[#f8f9ff] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0058be]/40';

/** Any address that doesn't exist: a friendly page with a way back, in the app's own look (not the framework's black page). */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f9ff] px-4">
      <div className="sf-rise w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-card-md">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff4ff]">
          <Compass className="h-7 w-7 text-[#0058be]" aria-hidden="true" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Page not found</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-[#091426]">We couldn’t find that page</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#64748b]">The link may be old or mistyped. Here are some places to go instead.</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/" className={primary}>
            Go home
          </Link>
          <Link href="/businesses" className={secondary}>
            Browse stores
          </Link>
        </div>
      </div>
    </main>
  );
}
