import type { Metadata } from 'next';

interface Props {
  children: React.ReactNode;
  params: Promise<{ uuid: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'shelflyd.com').toLowerCase();

interface PublicProduct {
  name: string;
  description: string | null;
  image: string | null;
  images?: string[];
  prices?: { price: number; currency: string; unitName: string; isBaseUnit?: boolean }[];
}

const clip = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

/** A product shared from the marketplace (not from a store's own address): its name, price and photo. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uuid } = await params;
  try {
    const res = await fetch(`${API_URL}/products/${encodeURIComponent(uuid)}`, { next: { revalidate: 60 } });
    if (!res.ok) return {};
    const product = (await res.json()) as PublicProduct;
    const price = product.prices?.find((p) => p.isBaseUnit) ?? product.prices?.[0];
    const amount = price ? `${price.currency === 'NGN' ? '₦' : `${price.currency} `}${price.price.toLocaleString('en-NG', { minimumFractionDigits: Number.isInteger(price.price) ? 0 : 2, maximumFractionDigits: 2 })} / ${price.unitName}` : null;
    const description = clip([amount, product.description?.trim()].filter(Boolean).join('. ') || 'Shop on Shelflyd.', 200);
    const photo = product.images?.[0] || product.image || '';
    const url = `https://${APP_DOMAIN}/products/${uuid}`;
    return {
      title: `${product.name} · Shelflyd`,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'website',
        siteName: 'Shelflyd',
        title: product.name,
        description,
        url,
        ...(photo.startsWith('https://') && { images: [{ url: photo, alt: product.name }] }),
      },
      twitter: { card: photo.startsWith('https://') ? 'summary_large_image' : 'summary', title: product.name, description, ...(photo.startsWith('https://') && { images: [photo] }) },
    };
  } catch {
    return {};
  }
}

export default function MarketplaceProductLayout({ children }: Props) {
  return children;
}
