import type { Metadata } from 'next';
import StorefrontLayoutClient from '@/components/storefront/storefront-layout-client';
import { FALLBACK_DESCRIPTION, FALLBACK_TITLE, fetchStore, storeMetadata } from '@/lib/storefront/server';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const info = await fetchStore(slug);
  if (!info) return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  return storeMetadata(slug, info);
}

export default async function StorefrontLayout({ children, params }: Props) {
  const { slug } = await params;
  return <StorefrontLayoutClient slug={slug}>{children}</StorefrontLayoutClient>;
}
