import { useEffect } from 'react';
import { analyticsApi } from '@/lib/api/analytics';

/** The address that reports a view of a product on a store's own page. */
export const storefrontViewPath = (slug: string, productId: number) => `/storefront/${encodeURIComponent(slug)}/products/${productId}/view`;
/** The address that reports a view of a product on the marketplace. */
export const marketplaceViewPath = (uuid: string) => `/products/${encodeURIComponent(uuid)}/view`;

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Reports that the shopper opened a product, once per browser session per product per day, so refreshing or going
 * back and forth does not inflate the count (the server ignores quick repeats too). Pass `null` to report nothing,
 * for example inside the storefront editor's preview.
 */
export function useTrackProductView(path: string | null) {
  useEffect(() => {
    if (!path) return;
    const key = `pv:${path}:${today()}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, '1');
    } catch {
      // Storage can be blocked (private windows); then the server's own repeat check is the only guard.
    }
    analyticsApi.recordView(path).catch(() => {});
  }, [path]);
}
