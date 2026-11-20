import type { StorefrontDesign } from '@/lib/storefront/design';

/**
 * Messages between the editor (parent) and the preview page (iframe at /storefront-preview). Same origin only.
 *   iframe → parent  { type: 'sf-ready' }               the page has loaded and wants the current design
 *   parent → iframe  { type: 'sf-design', design }      the working (unsaved) design to render
 */
export type PreviewMessage = { type: 'sf-ready' } | { type: 'sf-design'; design: StorefrontDesign };

export const isPreviewMessage = (data: unknown): data is PreviewMessage => {
  if (!data || typeof data !== 'object') return false;
  const t = (data as { type?: unknown }).type;
  return t === 'sf-ready' || t === 'sf-design';
};
