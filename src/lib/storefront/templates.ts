import { DESIGN_VERSION, classicDesign, type StorefrontDesign, type StorefrontSection } from './design';

/**
 * A ready-made starting point. Applying a template replaces the working design with `build(primary)`, using the
 * seller's own brand colour so the result is already "theirs". The result is an ordinary design document, so
 * everything about it can then be edited.
 */
export interface StorefrontTemplate {
  id: string;
  name: string;
  /** One line shown under the name in the picker. */
  tagline: string;
  /** Who it suits, e.g. "Food, bakes and groceries". */
  bestFor: string;
  build: (primary: string) => StorefrontDesign;
}

// Section builders: stable ids so switching templates keeps the editor's list tidy. Placeholder text is meant to be
// replaced by the seller but reads fine if left in.
const announcement = (text: string): StorefrontSection => ({
  id: 'announcement',
  type: 'announcement',
  variant: 'bar',
  props: { text, link: '' },
});
const info = (address: string, hours: string, phone: string): StorefrontSection => ({
  id: 'info',
  type: 'info',
  variant: 'strip',
  props: { address, hours, phone, email: '' },
});
const about = (body: string): StorefrontSection => ({
  id: 'about',
  type: 'about',
  variant: 'plain',
  props: { title: 'Our story', body },
});

export const TEMPLATES: StorefrontTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    tagline: 'Clean and balanced. The storefront every store starts with.',
    bestFor: 'Any kind of store',
    build: (primary) => classicDesign(primary),
  },
  {
    id: 'fresh',
    name: 'Fresh',
    tagline: 'Order-first and friendly, with your hours and location up front.',
    bestFor: 'Food, bakes and groceries',
    build: (primary): StorefrontDesign => ({
      version: DESIGN_VERSION,
      template: 'fresh',
      theme: { primary, radius: 'round', headingFont: 'manrope', bodyFont: 'inter' },
      header: { variant: 'classic', sticky: true },
      footer: { variant: 'light' },
      pages: {
        home: {
          sections: [
            announcement('Free delivery on orders over ₦20,000'),
            {
              id: 'hero',
              type: 'hero',
              variant: 'tinted',
              props: { heading: '', tagline: '', image: '', showOpenBadge: true, location: 'Your area, Lagos' },
            },
            info('Your street address, city', 'Mon–Sat 8am–6pm', '0800 000 0000'),
            { id: 'products', type: 'products', variant: 'grid', props: { title: 'Order now', columns: 4, showSearch: true, showSets: true } },
          ],
        },
      },
    }),
  },
  {
    id: 'boutique',
    name: 'Boutique',
    tagline: 'Big photos and quiet type that let the products speak.',
    bestFor: 'Fashion, beauty and gifts',
    build: (primary): StorefrontDesign => ({
      version: DESIGN_VERSION,
      template: 'boutique',
      theme: { primary, radius: 'sharp', headingFont: 'serif', bodyFont: 'inter' },
      header: { variant: 'centered', sticky: true },
      footer: { variant: 'light' },
      pages: {
        home: {
          sections: [
            {
              id: 'hero',
              type: 'hero',
              variant: 'banner',
              props: { heading: '', tagline: 'New arrivals every week', image: '', showOpenBadge: false, location: '' },
            },
            { id: 'products', type: 'products', variant: 'portrait', props: { title: 'The collection', columns: 3, showSearch: false, showSets: false } },
            about('Tell shoppers who you are and what makes your pieces different.'),
          ],
        },
      },
    }),
  },
  {
    id: 'market',
    name: 'Market',
    tagline: 'Dense and searchable, built for a big catalogue.',
    bestFor: 'Stores with many products',
    build: (primary): StorefrontDesign => ({
      version: DESIGN_VERSION,
      template: 'market',
      theme: { primary, radius: 'soft', headingFont: 'manrope', bodyFont: 'inter' },
      header: { variant: 'classic', sticky: true },
      footer: { variant: 'dark' },
      pages: {
        home: {
          sections: [
            announcement('Welcome! Use the search to find what you need'),
            { id: 'products', type: 'products', variant: 'compact', props: { title: 'All products', columns: 4, showSearch: true, showSets: true } },
            info('Your street address, city', 'Mon–Sat 8am–6pm', '0800 000 0000'),
            about('Tell shoppers who you are and what you sell.'),
          ],
        },
      },
    }),
  },
];

export function getTemplate(id: string): StorefrontTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
