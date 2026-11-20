/**
 * Where to send someone after they sign in or register, and how to build a login link that brings them back.
 * Only addresses inside this site are ever followed: `?from=https://elsewhere.example` must not become a redirect off the site.
 */

/** The path (with query) if `value` is an address on this site, else null. Rejects "//host", "/\host", full URLs and anything with control characters. */
export function safeReturnPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  if (/[\u0000-\u001f]/.test(value)) return null;
  return value;
}

const isAuthPath = (path: string) => path.startsWith('/auth') || path.startsWith('/dashboard/login') || path.startsWith('/admin/login');

/** The page the visitor is on now, as a return address; null on the home page, an auth page, or on the server. */
export function currentReturnPath(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname + window.location.search;
  return window.location.pathname === '/' || isAuthPath(path) ? null : safeReturnPath(path);
}

/** A login address that returns to the page the visitor is on now. */
export function loginHref(): string {
  const back = currentReturnPath();
  return back ? `/auth/login?from=${encodeURIComponent(back)}` : '/auth/login';
}

const LAST_STORE_KEY = 'mm-last-store';
const LAST_STORE_TTL_MS = 6 * 60 * 60 * 1000;

/** Remembers the store the shopper is looking at, so signing in without a return address can still bring them back to it. */
export function rememberStore(slug: string): void {
  try {
    window.localStorage.setItem(LAST_STORE_KEY, JSON.stringify({ slug, at: Date.now() }));
  } catch {
    // Storage can be blocked (private windows); then the fallbacks below simply apply.
  }
}

/** The store they last visited on this browser in the past few hours, as a path; null when there is none. */
export function lastStorePath(): string | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(LAST_STORE_KEY) ?? 'null') as { slug?: string; at?: number } | null;
    if (!saved?.slug || !saved.at || Date.now() - saved.at > LAST_STORE_TTL_MS) return null;
    return /^[a-z0-9-]{1,64}$/.test(saved.slug) ? `/storefront/${saved.slug}` : null;
  } catch {
    return null;
  }
}

/** Where to go after signing in or registering: the address they were sent from, else the page they came from, else the store they were visiting, else home. */
export function afterAuthPath(from: string | null | undefined): string {
  return safeReturnPath(from) ?? referrerPath() ?? lastStorePath() ?? '/';
}

/** Where they were before arriving here (same site only), for when no return address was given. */
export function referrerPath(): string | null {
  if (typeof document === 'undefined' || !document.referrer) return null;
  try {
    const url = new URL(document.referrer);
    if (url.origin !== window.location.origin) return null;
    const path = url.pathname + url.search;
    return isAuthPath(path) || url.pathname === '/' ? null : safeReturnPath(path);
  } catch {
    return null;
  }
}
