/** The domain business storefronts are served from ({slug}.shelflyd.shop). Override with NEXT_PUBLIC_STOREFRONT_DOMAIN. */
export const STOREFRONT_DOMAIN = (process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN ?? 'shelflyd.shop').toLowerCase();

/**
 * The public address of a store (or of a path in it): https://acme.shelflyd.shop in production, and the
 * /storefront/acme path when the app is running on localhost (subdomains don't exist there). A store with its
 * own live domain (`customDomain`) is addressed by that domain instead.
 */
export function storefrontUrl(slug: string, path = '', customDomain?: string | null): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
      return `${window.location.origin}/storefront/${slug}${path}`;
    }
  }
  if (customDomain) {
    return `https://${customDomain}${path}`;
  }
  return `https://${slug}.${STOREFRONT_DOMAIN}${path}`;
}

/** The main marketplace domain (shelflyd.com). Override with NEXT_PUBLIC_APP_DOMAIN. */
export const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'shelflyd.com').toLowerCase();

/**
 * A link to a page of the main marketplace that works from anywhere: on a store's own address (acme.shelflyd.shop or
 * a custom domain) a plain "/businesses" would stay inside that store, so it points at shelflyd.com instead. On
 * localhost, where everything is one site, it stays relative. Call it in the browser (after the page has loaded).
 */
export function appUrl(path = '/'): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost') || host === APP_DOMAIN || host === `www.${APP_DOMAIN}`) {
      return path;
    }
  }
  return `https://${APP_DOMAIN}${path}`;
}
