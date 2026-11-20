'use client';

import type { CSSProperties, ReactNode } from 'react';
import { themeCssVars } from '@/lib/storefront/design';
import CartDrawer from './cart-drawer';
import StorefrontFooter from './footer';
import StorefrontHeader from './header';
import { useStorefront } from './storefront-context';
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
  const { info, design, preview } = useStorefront();
  useApplyDesignTheme(design, !!info && !preview);
  const scoped = preview ? (themeCssVars(design.theme) as CSSProperties) : undefined;
  return (
    <div
      className="sf-root min-h-screen flex flex-col bg-[#f8f9ff]"
      style={{ fontFamily: 'var(--sf-body-font, var(--font-inter))', ...scoped }}
    >
      <style>{`.sf-root h1,.sf-root h2,.sf-root h3{font-family:var(--sf-heading-font,var(--font-manrope))}`}</style>
      <StorefrontHeader totalItems={totalItems} isAuthenticated={isAuthenticated} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
      <CartDrawer />
    </div>
  );
}
