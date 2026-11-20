/** The domain business storefronts are served from ({slug}.shelflyd.shop). Override with NEXT_PUBLIC_STOREFRONT_DOMAIN. */
export const STOREFRONT_DOMAIN = (process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN ?? 'shelflyd.shop').toLowerCase();

/**
 * The public address of a store (or of a path in it): https://acme.shelflyd.shop in production, and the
 * /storefront/acme path when the app is running on localhost (subdomains don't exist there).
 */
export function storefrontUrl(slug: string, path = ''): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
      return `${window.location.origin}/storefront/${slug}${path}`;
    }
  }
  return `https://${slug}.${STOREFRONT_DOMAIN}${path}`;
}
