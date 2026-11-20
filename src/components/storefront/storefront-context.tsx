'use client';

import { createContext, useContext, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { StorefrontInfo } from '@/types';
import { normalizeDesign, type PageKey, type StorefrontDesign } from '@/lib/storefront/design';

interface StorefrontContextValue {
  slug: string;
  info: StorefrontInfo | undefined;
  isLoading: boolean;
  /** Always complete and safe to render: whatever the server sent, passed through normalizeDesign. */
  design: StorefrontDesign;
  /** The editor's live preview: links stay on the page and the theme is scoped to the preview instead of the whole document. */
  preview: boolean;
  /** Preview only: the page being shown, so the header menu can highlight it (live pages work it out from the URL). */
  activePage: string | undefined;
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

interface ProviderProps {
  slug: string;
  info: StorefrontInfo | undefined;
  isLoading: boolean;
  /** A design to show instead of the published one (the editor passes the working draft here). */
  designOverride?: unknown;
  preview?: boolean;
  /** Preview only: 'home', 'custom:<id>', 'product' or 'cart'. */
  activePage?: string;
  children: React.ReactNode;
}

export function StorefrontProvider({ slug, info, isLoading, designOverride, preview = false, activePage, children }: ProviderProps) {
  const raw = designOverride ?? info?.design;
  const themeColor = info?.themeColor;
  const design = useMemo(() => normalizeDesign(raw, themeColor), [raw, themeColor]);
  const value = useMemo(
    () => ({ slug, info, isLoading, design, preview, activePage }),
    [slug, info, isLoading, design, preview, activePage],
  );
  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

export function useStorefront(): StorefrontContextValue {
  const ctx = useContext(StorefrontContext);
  if (!ctx) throw new Error('useStorefront must be used inside <StorefrontProvider>');
  return ctx;
}

export interface NavLink {
  key: PageKey;
  label: string;
  href: string;
}

/**
 * The header/footer menu: Home plus every extra page the seller chose to show there, in order. Empty when there
 * are no such pages, so a store without extra pages gets no menu at all.
 */
export function useNavPages(): NavLink[] {
  const { slug, design } = useStorefront();
  return useMemo(() => {
    const pages = design.pages.custom.filter((p) => p.showInNav);
    if (pages.length === 0) return [];
    return [
      { key: 'home' as PageKey, label: 'Home', href: `/storefront/${slug}` },
      ...pages.map((p) => ({ key: `custom:${p.id}` as PageKey, label: p.title, href: `/storefront/${slug}/p/${p.id}` })),
    ];
  }, [slug, design.pages.custom]);
}

/** Which menu entry is the current page: from the URL on the live site, from the editor in the preview. */
export function useActivePage(): string | undefined {
  const { activePage, preview } = useStorefront();
  const pathname = usePathname();
  if (preview) return activePage;
  const custom = pathname.match(/\/p\/([a-z0-9-]+)\/?$/);
  if (custom) return `custom:${custom[1]}`;
  // The home page is the store's root; product, cart and checkout pages are not menu entries.
  return /^\/storefront\/[^/]+\/?$/.test(pathname) || pathname === '/' ? 'home' : undefined;
}
