'use client';

import { useEffect } from 'react';
import { themeCssVars, type StorefrontDesign } from '@/lib/storefront/design';
import { useThemeStore } from '@/stores/theme.store';

/**
 * Applies a design's theme (colour, radius, fonts) to <html> while the storefront is on screen, so dialogs and sheets
 * (which render in a portal outside the page) match it. When the storefront unmounts — or the design changes — the
 * previous values are put back, so a business's colour never leaks into the marketplace or dashboard.
 * Pass enabled=false to skip it (while the design is still loading, or in the editor preview).
 */
export function useApplyDesignTheme(design: StorefrontDesign, enabled = true) {
  const { primary, radius, headingFont, bodyFont } = design.theme;
  useEffect(() => {
    if (!enabled) return;
    const vars = themeCssVars({ primary, radius, headingFont, bodyFont });
    const root = document.documentElement.style;
    const previous = Object.keys(vars).map((name) => [name, root.getPropertyValue(name)] as const);
    const previousPrimary = useThemeStore.getState().primaryColor;
    for (const [name, value] of Object.entries(vars)) root.setProperty(name, value);
    useThemeStore.setState({ primaryColor: primary });
    return () => {
      for (const [name, value] of previous) {
        if (value) root.setProperty(name, value);
        else root.removeProperty(name);
      }
      useThemeStore.setState({ primaryColor: previousPrimary });
    };
  }, [enabled, primary, radius, headingFont, bodyFont]);
}
