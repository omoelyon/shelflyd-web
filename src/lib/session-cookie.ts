import { sharedCookieDomain } from '@/lib/storefront/url';

const NAME = 'mm_token';
/** Readable by the page (unlike the token): only says "someone is signed in on this browser", so a page opened on another address (app.shelflyd.com) knows to check. */
export const SIGNED_IN_HINT = 'mm_signed_in';

function hostOf(request: Request): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? new URL(request.url).host;
  return host.split(',')[0].trim().split(':')[0].toLowerCase();
}

function build(value: string, maxAge: number, domain?: string, name = NAME, httpOnly = true): string {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', `Max-Age=${maxAge}`, 'SameSite=Lax'];
  if (httpOnly) parts.push('HttpOnly');
  if (maxAge === 0) parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  if (domain) parts.push(`Domain=${domain}`);
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

/**
 * The sign-in cookie for this address. On shelflyd.com, app.shelflyd.com and admin.shelflyd.com it is shared across
 * all three (one sign-in for the marketplace and the dashboard); on a store's own address it stays with that address.
 * maxAge 0 removes it.
 */
export function sessionCookie(request: Request, token: string, maxAge: number): string {
  return build(token, maxAge, sharedCookieDomain(hostOf(request)));
}

/** The signed-in hint, on the same addresses as the sign-in cookie. Holds no secret. */
export function signedInHintCookie(request: Request, maxAge: number): string {
  return build(maxAge > 0 ? '1' : '', maxAge, sharedCookieDomain(hostOf(request)), SIGNED_IN_HINT, false);
}

/**
 * When the cookie is shared, also remove any older copy kept to this address alone (from before the split), so the
 * browser doesn't send two sign-ins and the backend doesn't read the stale one.
 */
export function staleHostOnlyCookie(request: Request): string | null {
  return sharedCookieDomain(hostOf(request)) ? build('', 0) : null;
}
