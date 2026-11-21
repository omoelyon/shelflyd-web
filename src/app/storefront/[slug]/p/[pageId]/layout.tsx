import type { Metadata } from 'next';
import { customPageMetadata, fetchStore } from '@/lib/storefront/server';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string; pageId: string }>;
}

/** A shared extra page (About, Delivery…) is titled with the page and the store. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, pageId } = await params;
  const info = await fetchStore(slug);
  if (!info) return {};
  return customPageMetadata(slug, info, pageId) ?? {};
}

export default function CustomPageLayout({ children }: Props) {
  return children;
}
