import type { Metadata } from 'next';
import { normalizeDesign } from '@/lib/storefront/design';
import { STOREFRONT_DOMAIN } from '@/lib/storefront/url';
import type { Product, StorefrontInfo } from '@/types';

/** Server-side helpers for the storefront's page metadata (what a shared link looks like in WhatsApp, Facebook, X and search). Nothing here runs in the browser. */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
export const FALLBACK_TITLE = 'Shelflyd store';
export const FALLBACK_DESCRIPTION = 'Shop online with Shelflyd.';

/** The published store details. Never throws: a failure just means generic metadata. Reused for a minute because crawlers hit it often. */
export async function fetchStore(slug: string): Promise<StorefrontInfo | null> {
  try {
    const res = await fetch(`${API_URL}/storefront/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as StorefrontInfo;
  } catch {
    return null;
  }
}

/** One of the store's products, or null when it doesn't exist or is hidden. */
export async function fetchProduct(slug: string, productId: string): Promise<Product | null> {
  if (!/^\d+$/.test(productId)) return null;
  try {
    const res = await fetch(`${API_URL}/storefront/${encodeURIComponent(slug)}/products/${productId}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}

/** The address the store is canonical at: its own live domain, else its shelflyd.shop address. */
export function siteUrlFor(slug: string, info: StorefrontInfo | null): string {
  return info?.customDomain ? `https://${info.customDomain}` : `https://${slug}.${STOREFRONT_DOMAIN}`;
}

/** The branded share card drawn for a store (or for one of its products), used when no photo is available. */
export function shareCardUrl(siteUrl: string, slug: string, productId?: string): string {
  return `${siteUrl}/api/og/store/${encodeURIComponent(slug)}${productId ? `?product=${encodeURIComponent(productId)}` : ''}`;
}

/** The cheapest sensible price to show for a product: its base unit, else the first one. */
export function displayPrice(product: Product): { text: string; plain: string; unit: string } | null {
  const price = product.prices?.find((p) => p.isBaseUnit) ?? product.prices?.[0];
  if (!price) return null;
  const amount = price.price.toLocaleString('en-NG', { minimumFractionDigits: Number.isInteger(price.price) ? 0 : 2, maximumFractionDigits: 2 });
  const symbol = price.currency === 'NGN' ? '₦' : `${price.currency} `;
  // `plain` is for the share card: its only bundled font has no ₦ glyph (it would print an empty box), so it writes the code instead.
  return { text: `${symbol}${amount}`, plain: `${price.currency} ${amount}`, unit: price.unitName };
}

const clip = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

interface Page {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  url: string;
  siteName: string;
}

/** Turns page details into the full set of tags: Open Graph (WhatsApp, Facebook, LinkedIn, Telegram) and the X card. */
export function metadataFor(page: Page): Metadata {
  return {
    metadataBase: new URL(page.url),
    title: page.title,
    description: page.description,
    alternates: { canonical: page.url },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: page.siteName,
      title: page.title,
      description: page.description,
      url: page.url,
      images: [{ url: page.image, width: 1200, height: 630, alt: page.imageAlt }],
    },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description, images: [page.image] },
  };
}

/** What the store itself looks like when shared: its own search title/description/image, else its name, description and a branded card. */
export function storeMetadata(slug: string, info: StorefrontInfo): Metadata {
  // Only the published design is used: a private draft preview must never leak into what crawlers see.
  const { seo } = normalizeDesign(info.design, info.themeColor);
  const siteUrl = siteUrlFor(slug, info);
  return metadataFor({
    title: seo.title.trim() || info.name || FALLBACK_TITLE,
    description: clip(seo.description.trim() || info.description?.trim() || `Shop ${info.name} online.`, 200),
    image: seo.image.trim() || shareCardUrl(siteUrl, slug),
    imageAlt: `${info.name} on Shelflyd`,
    url: siteUrl,
    siteName: info.name,
  });
}

/** A product when shared: its name and store, a short line with price and availability, and its first photo (or the branded card). */
export function productMetadata(slug: string, info: StorefrontInfo, product: Product): Metadata {
  const siteUrl = siteUrlFor(slug, info);
  const price = displayPrice(product);
  const status = product.status === 'OUT_OF_STOCK' ? 'Sold out' : product.status === 'COMING_SOON' ? 'Coming soon' : null;
  const lead = [price ? `${price.text} / ${price.unit}` : null, status, info.name].filter(Boolean).join(' · ');
  const detail = product.description?.trim();
  const photo = product.images?.[0] || product.image || '';
  return metadataFor({
    title: `${product.name} · ${info.name}`,
    description: clip(detail ? `${lead}. ${detail}` : lead, 200),
    image: photo.startsWith('https://') ? photo : shareCardUrl(siteUrl, slug, String(product.id)),
    imageAlt: product.name,
    url: `${siteUrl}/products/${product.id}`,
    siteName: info.name,
  });
}

/** An extra page (About, Delivery…) when shared: its title with the store's name, and the store's own description and image. */
export function customPageMetadata(slug: string, info: StorefrontInfo, pageId: string): Metadata | null {
  const { pages, seo } = normalizeDesign(info.design, info.themeColor);
  const page = pages.custom.find((p) => p.id === pageId);
  if (!page) return null;
  const siteUrl = siteUrlFor(slug, info);
  return metadataFor({
    title: `${page.title} · ${info.name}`,
    description: clip(seo.description.trim() || info.description?.trim() || `${page.title} at ${info.name}.`, 200),
    image: seo.image.trim() || shareCardUrl(siteUrl, slug),
    imageAlt: `${info.name} on Shelflyd`,
    url: `${siteUrl}/p/${pageId}`,
    siteName: info.name,
  });
}
