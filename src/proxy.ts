import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_HOST, APP_DOMAIN, DASHBOARD_HOST, STOREFRONT_DOMAIN } from '@/lib/storefront/url';

const DASHBOARD_PATHS = ['/dashboard'];
// /invites is not here: its page shows the invite to signed-out visitors and offers sign-in or sign-up itself.
const PROTECTED_PATHS = ['/checkout', '/account'];
const ADMIN_PATHS = ['/admin'];
const RESERVED_SUBDOMAINS = ['www', 'api'];

/**
 * Domain architecture
 * ─────────────────────────────────────────────────────────
 * shelflyd.com          → main marketplace app (browse, cart, account, auth)
 *
 * app.shelflyd.com      → the business dashboard (/dashboard…), when NEXT_PUBLIC_DASHBOARD_HOST is set
 * admin.shelflyd.com    → Shelflyd staff admin (/admin…), when NEXT_PUBLIC_ADMIN_HOST is set
 *                          Each address only serves its own pages; the others are sent to the right address.
 *                          Unset (local, staging): everything is served from one site.
 *
 * *.shelflyd.shop       → merchant storefronts
 *                          acme.shelflyd.shop → /storefront/acme
 *
 * shelflyd.shop (apex)  → redirect to shelflyd.com
 *
 * shop.theirbrand.com   → a seller's own domain (production only).
 *                          Looked up through the API; see resolveCustomDomain.
 * ─────────────────────────────────────────────────────────
 *
 * Override via env vars:
 *   NEXT_PUBLIC_APP_DOMAIN      (default: shelflyd.com)
 *   NEXT_PUBLIC_DASHBOARD_HOST  (e.g. app.shelflyd.com; unset = dashboard stays on the main site)
 *   NEXT_PUBLIC_ADMIN_HOST      (e.g. admin.shelflyd.com; unset = admin stays on the main site)
 *   NEXT_PUBLIC_STOREFRONT_DOMAIN (default: shelflyd.shop)
 *   NEXT_PUBLIC_CUSTOM_DOMAINS_ENABLED (set to "true" in production to serve sellers' own domains)
 */
const CUSTOM_DOMAINS_ENABLED = process.env.NEXT_PUBLIC_CUSTOM_DOMAINS_ENABLED === 'true';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

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

/** A seller's own domain and the store it serves. `hostname` is the address visitors are sent to (e.g. brand.com for www.brand.com). */
interface ResolvedDomain {
  slug: string;
  hostname: string;
}

const HIT_TTL_MS = 60_000;
const MISS_TTL_MS = 15_000;
const CACHE_LIMIT = 500;
// Kept per server instance so we do not ask the API on every request: hits for a minute, misses for 15 seconds.
const domainCache = new Map<string, { value: ResolvedDomain | null; expires: number }>();

/** Whether a host could be a seller's own domain: anything that is not ours, not local and not a hosting-provider address. */
function isCustomDomainCandidate(host: string): boolean {
  if (!host) return false;
  if (host === APP_DOMAIN || host.endsWith(`.${APP_DOMAIN}`)) return false;
  if (host === STOREFRONT_DOMAIN || host.endsWith(`.${STOREFRONT_DOMAIN}`)) return false;
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.localhost')) return false;
  if (host.endsWith('.vercel.app') || host.endsWith('.railway.app')) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  return true;
}

/** Asks the API which store a custom domain belongs to. Never throws: any failure counts as "not a known domain". */
async function resolveCustomDomain(host: string): Promise<ResolvedDomain | null> {
  const cached = domainCache.get(host);
  if (cached && cached.expires > Date.now()) return cached.value;

  let value: ResolvedDomain | null = null;
  try {
    const res = await fetch(`${API_URL}/domains/resolve?host=${encodeURIComponent(host)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const body = (await res.json()) as Partial<ResolvedDomain>;
      if (body.slug && body.hostname) value = { slug: body.slug, hostname: body.hostname.toLowerCase() };
    }
  } catch {
    value = null;
  }
  if (domainCache.size >= CACHE_LIMIT) domainCache.clear();
  domainCache.set(host, { value, expires: Date.now() + (value ? HIT_TTL_MS : MISS_TTL_MS) });
  return value;
}

/**
 * Sends a request for a store's own address (a {slug}.shelflyd.shop subdomain or a custom domain) to that store's
 * pages. Returns null for /auth, /api and the shopper's /account pages, which stay with the main app (on the same
 * address, so the shopper stays signed in).
 */
function storefrontResponse(request: NextRequest, slug: string): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/auth') || pathname.startsWith('/api') || pathname.startsWith('/account')) return null;
  const url = request.nextUrl.clone();
  // Storefront pages link to each other as /storefront/<slug>/... . On the storefront's own domain that prefix is
  // already implied, so send those to the clean URL (acme.shelflyd.shop/cart) instead of doubling it up.
  const prefix = `/storefront/${slug}`;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    url.pathname = pathname.slice(prefix.length) || '/';
    return NextResponse.redirect(url, 308);
  }
  url.pathname = `/storefront/${slug}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

/** Paths every address serves: Next's API routes (and the /api/v1 proxy to the backend), the offline page, and files such as /manifest.json. */
function servedEverywhere(pathname: string): boolean {
  return pathname.startsWith('/api') || pathname === '/offline' || /\.[a-z0-9]+$/i.test(pathname);
}

const startsWithAny = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** The same address on another host, keeping the path, query, protocol and port (the port only matters locally). */
function onHost(request: NextRequest, host: string, pathname?: string): NextResponse {
  const url = request.nextUrl.clone();
  url.hostname = host;
  if (pathname !== undefined) {
    url.pathname = pathname;
    url.search = '';
  }
  return NextResponse.redirect(url, 308);
}

/**
 * Keeps the dashboard on app.shelflyd.com and the admin on admin.shelflyd.com, and everything else on the marketplace.
 * Old links (shelflyd.com/dashboard/orders, emails, Paystack returns) are sent on with their path and query intact.
 * Returns null when the request belongs where it is.
 */
function areaRedirect(request: NextRequest, hostname: string): NextResponse | null {
  if (!DASHBOARD_HOST && !ADMIN_HOST) return null;
  const { pathname } = request.nextUrl;
  if (servedEverywhere(pathname)) return null;
  const isDashboard = startsWithAny(pathname, ['/dashboard']);
  const isAdmin = startsWithAny(pathname, ['/admin']);

  if (hostname === DASHBOARD_HOST) {
    if (pathname === '/') return onHost(request, hostname, '/dashboard');
    if (isAdmin) return ADMIN_HOST ? onHost(request, ADMIN_HOST) : onHost(request, APP_DOMAIN);
    // Sign-in, team invitations and the store editor's live preview are part of running a business too.
    if (isDashboard || startsWithAny(pathname, ['/auth', '/invites', '/storefront-preview'])) return null;
    return onHost(request, APP_DOMAIN);
  }
  if (hostname === ADMIN_HOST) {
    if (pathname === '/') return onHost(request, hostname, '/admin');
    if (isDashboard) return onHost(request, DASHBOARD_HOST ?? APP_DOMAIN);
    if (isAdmin || startsWithAny(pathname, ['/auth'])) return null;
    return onHost(request, APP_DOMAIN);
  }
  if (hostname === APP_DOMAIN || hostname === `www.${APP_DOMAIN}`) {
    if (isDashboard && DASHBOARD_HOST) return onHost(request, DASHBOARD_HOST);
    if (isAdmin && ADMIN_HOST) return onHost(request, ADMIN_HOST);
  }
  return null;
}

/** The dashboard and admin addresses are private tools: keep them out of search results. */
function withNoIndex(response: NextResponse, hostname: string): NextResponse {
  if (hostname === DASHBOARD_HOST || hostname === ADMIN_HOST) response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export async function proxy(request: NextRequest) {
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
    const response = storefrontResponse(request, slug);
    if (response) return response;
  } else if (CUSTOM_DOMAINS_ENABLED && isCustomDomainCandidate(hostname)) {
    // shop.theirbrand.com → the store that proved it owns this domain (production only)
    const resolved = await resolveCustomDomain(hostname);
    if (!resolved) {
      // Not a domain any store has connected: send the visitor to the marketplace rather than show a broken page.
      return NextResponse.redirect(`https://${APP_DOMAIN}`, 302);
    }
    if (hostname !== resolved.hostname) {
      // e.g. www.brand.com → brand.com, so each store has one canonical address
      const url = request.nextUrl.clone();
      url.protocol = 'https';
      url.host = resolved.hostname;
      url.port = '';
      return NextResponse.redirect(url, 308);
    }
    const response = storefrontResponse(request, resolved.slug);
    if (response) return response;
  }

  // ── Main site (shelflyd.com, app.shelflyd.com, admin.shelflyd.com) ──────────

  const moved = areaRedirect(request, hostname);
  if (moved) return moved;

  const token = request.cookies.get('mm_token')?.value;

  // Admin routes → /admin/login if not authenticated
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath && pathname !== '/admin/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Dashboard routes → /dashboard/login if not authenticated
  const isDashboardPath = DASHBOARD_PATHS.some((p) => pathname.startsWith(p));
  if (isDashboardPath && pathname !== '/dashboard/login' && !token) {
    const loginUrl = new URL('/dashboard/login', request.url);
    loginUrl.searchParams.set('from', pathname + request.nextUrl.search); // keep ?token= / ?reference=
    return NextResponse.redirect(loginUrl);
  }

  // Protected routes → /auth/login if not authenticated
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname + request.nextUrl.search); // keep ?token= / ?reference=
    return NextResponse.redirect(loginUrl);
  }

  return withNoIndex(NextResponse.next(), hostname);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
