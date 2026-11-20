import type { PageKey, StorefrontDesign } from '@/lib/storefront/design';

/** What the preview can show: the home page, an extra page, or the (sample) product page or cart. */
export type PreviewPage = PageKey | 'product' | 'cart';

/**
 * Messages between the editor (parent) and the preview page (iframe at /storefront-preview). Same origin only.
 *   iframe → parent  { type: 'sf-ready' }               the page has loaded and wants the current design and page
 *   parent → iframe  { type: 'sf-design', design }      the working (unsaved) design to render
 *   parent → iframe  { type: 'sf-page', page }          which page to show (home until told otherwise)
 */
export type PreviewMessage =
  | { type: 'sf-ready' }
  | { type: 'sf-design'; design: StorefrontDesign }
  | { type: 'sf-page'; page: PreviewPage };

export const isPreviewMessage = (data: unknown): data is PreviewMessage => {
  if (!data || typeof data !== 'object') return false;
  const t = (data as { type?: unknown }).type;
  return t === 'sf-ready' || t === 'sf-design' || t === 'sf-page';
};
