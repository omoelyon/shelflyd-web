/**
 * Whether a remote photo can go through Next's image resizing (smaller files for phones), which only works for hosts
 * listed in next.config.ts. Unknown hosts are shown as they are, so a photo never breaks. Uploaded photos live on R2:
 * `*.r2.dev`, or your own photo domain listed in NEXT_PUBLIC_IMAGE_HOSTS (comma-separated host names).
 */
const EXTRA_HOSTS = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

export function canOptimizeImage(src: string | null | undefined): boolean {
  if (!src || !src.startsWith('https://')) return false;
  try {
    const host = new URL(src).hostname.toLowerCase();
    return host.endsWith('.r2.dev') || host === 'api.shelflyd.com' || host === 'ui-avatars.com' || EXTRA_HOSTS.includes(host);
  } catch {
    return false;
  }
}

/** `sizes` for a product photo in a two-column phone grid that grows to three or four columns. */
export const PRODUCT_TILE_SIZES = '(min-width: 1280px) 22vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';
