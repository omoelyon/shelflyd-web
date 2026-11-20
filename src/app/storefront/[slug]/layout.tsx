import type { Metadata } from 'next';
import StorefrontLayoutClient from '@/components/storefront/storefront-layout-client';
import { normalizeDesign } from '@/lib/storefront/design';
import { STOREFRONT_DOMAIN } from '@/lib/storefront/url';
import type { StorefrontInfo } from '@/types';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const FALLBACK_TITLE = 'Shelflyd store';
const FALLBACK_DESCRIPTION = 'Shop online with Shelflyd.';

/** The published store details, read on the server for the page's metadata. Never throws: a failure just means generic metadata. */
async function loadStore(slug: string): Promise<StorefrontInfo | null> {
  try {
    // Metadata only needs to be roughly fresh, and crawlers hit it often: let the response be reused for a minute.
    const res = await fetch(`${API_URL}/storefront/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as StorefrontInfo;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const info = await loadStore(slug);
  if (!info) return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };

  // Only the published design is used here: a private draft preview must never leak into what crawlers see.
  const { seo } = normalizeDesign(info.design, info.themeColor);
  const title = seo.title.trim() || info.name || FALLBACK_TITLE;
  const description = seo.description.trim() || info.description?.trim() || FALLBACK_DESCRIPTION;
  const image = seo.image.trim() || info.logo || null;
  // A store with its own live domain is canonical at that address; its shelflyd.shop address is the fallback.
  const siteUrl = info.customDomain ? `https://${info.customDomain}` : `https://${slug}.${STOREFRONT_DOMAIN}`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: info.name,
      title,
      description,
      url: siteUrl,
      ...(image && { images: [{ url: image }] }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function StorefrontLayout({ children, params }: Props) {
  const { slug } = await params;
  return <StorefrontLayoutClient slug={slug}>{children}</StorefrontLayoutClient>;
}
