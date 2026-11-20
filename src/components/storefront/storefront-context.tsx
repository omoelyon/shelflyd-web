'use client';

import { createContext, useContext, useMemo } from 'react';
import type { StorefrontInfo } from '@/types';
import { normalizeDesign, type StorefrontDesign } from '@/lib/storefront/design';

interface StorefrontContextValue {
  slug: string;
  info: StorefrontInfo | undefined;
  isLoading: boolean;
  /** Always complete and safe to render: whatever the server sent, passed through normalizeDesign. */
  design: StorefrontDesign;
  /** The editor's live preview: links stay on the page and the theme is scoped to the preview instead of the whole document. */
  preview: boolean;
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

interface ProviderProps {
  slug: string;
  info: StorefrontInfo | undefined;
  isLoading: boolean;
  /** A design to show instead of the published one (the editor passes the working draft here). */
  designOverride?: unknown;
  preview?: boolean;
  children: React.ReactNode;
}

export function StorefrontProvider({ slug, info, isLoading, designOverride, preview = false, children }: ProviderProps) {
  const raw = designOverride ?? info?.design;
  const themeColor = info?.themeColor;
  const design = useMemo(() => normalizeDesign(raw, themeColor), [raw, themeColor]);
  const value = useMemo(() => ({ slug, info, isLoading, design, preview }), [slug, info, isLoading, design, preview]);
  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

export function useStorefront(): StorefrontContextValue {
  const ctx = useContext(StorefrontContext);
  if (!ctx) throw new Error('useStorefront must be used inside <StorefrontProvider>');
  return ctx;
}
