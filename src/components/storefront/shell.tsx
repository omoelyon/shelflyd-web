'use client';

import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { themeCssVars } from '@/lib/storefront/design';
import CartDrawer from './cart-drawer';
import StoreAssistant from './assistant/store-assistant';
import StorefrontFooter from './footer';
import StorefrontHeader from './header';
import { exitPreview, useStorefront } from './storefront-context';
import { useApplyDesignTheme } from './use-apply-design-theme';

interface ShellProps {
  totalItems: number;
  isAuthenticated: boolean;
  children: ReactNode;
}

/**
 * The frame around every storefront page: the themed header and footer. The live site applies the theme to the
 * whole document (so dialogs match); the editor preview (`preview`) scopes it to this frame so it doesn't restyle
 * the dashboard around it.
 */
export default function StorefrontShell({ totalItems, isAuthenticated, children }: ShellProps) {
  const { slug, info, design, preview, previewing } = useStorefront();
  useApplyDesignTheme(design, !!info && !preview);

  // A private draft preview must never be indexed, even if someone posts the link.
  useEffect(() => {
    if (!previewing) return;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [previewing]);

  const scoped = preview ? (themeCssVars(design.theme) as CSSProperties) : undefined;
  return (
    <div
      className="sf-root min-h-screen flex flex-col bg-[#f8f9ff]"
      style={{ fontFamily: 'var(--sf-body-font, var(--font-inter))', ...scoped }}
    >
      <style>{`.sf-root h1,.sf-root h2,.sf-root h3{font-family:var(--sf-heading-font,var(--font-manrope))}`}</style>
      {previewing && (
        <div role="status" className="relative z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-100 px-4 py-2 text-center text-xs text-amber-950">
          <span>Draft preview. Only people with this link can see it; shoppers still see the published store.</span>
          <button type="button" onClick={() => exitPreview(slug)} className="rounded-md border border-amber-900/30 bg-white/70 px-2 py-0.5 font-medium hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-900">
            Exit preview
          </button>
        </div>
      )}
      <StorefrontHeader totalItems={totalItems} isAuthenticated={isAuthenticated} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
      <CartDrawer />
      <StoreAssistant />
    </div>
  );
}
