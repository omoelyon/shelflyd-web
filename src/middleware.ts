import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/cart', '/checkout', '/account', '/invites'];
const ADMIN_PATHS = ['/admin'];
const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Subdomain detection: slug.shelflyd.com → rewrite to /storefront/slug/...
  const hostname = request.headers.get('host') ?? '';
  const hostParts = hostname.split('.');

  if (hostParts.length >= 3 && !RESERVED_SUBDOMAINS.includes(hostParts[0])) {
    const slug = hostParts[0];
    if (!pathname.startsWith('/auth') && !pathname.startsWith('/api')) {
      const url = request.nextUrl.clone();
      url.pathname = `/storefront/${slug}${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  const token = request.cookies.get('mm_token')?.value;

  // Admin routes → redirect to /admin/login (skip /admin/login itself)
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath && pathname !== '/admin/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Regular protected routes → redirect to /auth/login
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
