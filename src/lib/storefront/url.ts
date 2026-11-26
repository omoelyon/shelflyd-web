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

/**
 * Where the business dashboard and the staff admin live when they have their own addresses (app.shelflyd.com and
 * admin.shelflyd.com). Set NEXT_PUBLIC_DASHBOARD_HOST and NEXT_PUBLIC_ADMIN_HOST in production; when unset (local
 * development, staging) everything stays on one site, as before.
 */
export const DASHBOARD_HOST = (process.env.NEXT_PUBLIC_DASHBOARD_HOST ?? '').trim().toLowerCase() || null;
export const ADMIN_HOST = (process.env.NEXT_PUBLIC_ADMIN_HOST ?? '').trim().toLowerCase() || null;

/** Whether `host` is one of the main site's own addresses: the marketplace, the dashboard or the admin. */
export function isMainSiteHost(host: string): boolean {
  return host === APP_DOMAIN || host === `www.${APP_DOMAIN}` || host === DASHBOARD_HOST || host === ADMIN_HOST;
}

/**
 * The domain the sign-in cookie is shared across (shelflyd.com, so signing in on the marketplace also signs you in on
 * app.shelflyd.com), or undefined to keep it to the one address. Only when the dashboard or admin has its own address.
 */
export function sharedCookieDomain(host: string): string | undefined {
  if (!DASHBOARD_HOST && !ADMIN_HOST) return undefined;
  return host === APP_DOMAIN || host.endsWith(`.${APP_DOMAIN}`) ? APP_DOMAIN : undefined;
}

function onAddress(target: string | null, path: string): string {
  if (!target || typeof window === 'undefined') return path;
  const here = window.location.hostname.toLowerCase();
  if (here === target || !(isMainSiteHost(here) || here.endsWith(`.${STOREFRONT_DOMAIN}`))) return path;
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${window.location.protocol}//${target}${port}${path}`;
}

/** A link to the business dashboard that works from anywhere: app.shelflyd.com/dashboard… in production, the plain path otherwise. Call it in the browser. */
export function dashboardUrl(path = '/dashboard'): string {
  return onAddress(DASHBOARD_HOST, path);
}

/** A link to the staff admin: admin.shelflyd.com/admin… in production, the plain path otherwise. Call it in the browser. */
export function adminUrl(path = '/admin'): string {
  return onAddress(ADMIN_HOST, path);
}
