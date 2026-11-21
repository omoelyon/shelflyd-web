import type { Metadata } from 'next';
import { fetchProduct, fetchStore, productMetadata } from '@/lib/storefront/server';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string; productId: string }>;
}

/** A shared product link shows the product (name, price, photo) with the store's name, not just the store. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productId } = await params;
  const [info, product] = await Promise.all([fetchStore(slug), fetchProduct(slug, productId)]);
  // Unknown or hidden product: leave the store's own metadata (inherited from the layout above) in place.
  if (!info || !product) return {};
  return productMetadata(slug, info, product);
}

export default function ProductLayout({ children }: Props) {
  return children;
}
