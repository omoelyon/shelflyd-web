import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/cart', '/checkout', '/account', '/invites'];
const ADMIN_PATHS = ['/admin'];
const RESERVED_SUBDOMAINS = ['www', 'api'];

/**
 * Domain architecture
 * ─────────────────────────────────────────────────────────
 * shelflyd.com          → main marketplace app
 *                          (dashboard, admin, browse, auth)
 *
 * *.shelflyd.shop       → merchant storefronts
 *                          acme.shelflyd.shop → /storefront/acme
 *
 * shelflyd.shop (apex)  → redirect to shelflyd.com
 * ─────────────────────────────────────────────────────────
 *
 * Override via env vars:
 *   NEXT_PUBLIC_APP_DOMAIN      (default: shelflyd.com)
 *   NEXT_PUBLIC_STOREFRONT_DOMAIN (default: shelflyd.shop)
 */
const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'shelflyd.com').toLowerCase();
const STOREFRONT_DOMAIN = (process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN ?? 'shelflyd.shop').toLowerCase();

/**
 * Returns the merchant slug if the request is a storefront subdomain,
 * e.g. "acme.shelflyd.shop" → "acme".
 * Returns null for the apex domain or reserved subdomains.
 */
function extractStoreSlug(hostname: string): string | null {
  const host = hostname.split(':')[0].toLowerCase(); // strip port
  const suffix = `.${STOREFRONT_DOMAIN}`;
  if (host.endsWith(suffix)) {
    const sub = host.slice(0, host.length - suffix.length);
    if (sub && !sub.includes('.') && !RESERVED_SUBDOMAINS.includes(sub)) {
      return sub;
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  const hostname = (request.headers.get('host') ?? '').split(':')[0].toLowerCase();

  // ── Storefront domain (shelflyd.shop) ────────────────────────────────────────

  // Apex shelflyd.shop → redirect to shelflyd.com
  if (hostname === STOREFRONT_DOMAIN) {
    return NextResponse.redirect(`https://${APP_DOMAIN}${pathname}`, 301);
  }

  // acme.shelflyd.shop → rewrite to /storefront/acme/...
  const slug = extractStoreSlug(hostname);
  if (slug) {
    if (!pathname.startsWith('/auth') && !pathname.startsWith('/api')) {
      const url = request.nextUrl.clone();
      url.pathname = `/storefront/${slug}${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // ── Main app domain (shelflyd.com) ───────────────────────────────────────────

  const token = request.cookies.get('mm_token')?.value;

  // Admin routes → /admin/login if not authenticated
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath && pathname !== '/admin/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protected routes → /auth/login if not authenticated
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
