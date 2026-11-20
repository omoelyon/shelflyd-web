'use client';

import type { ComponentType } from 'react';
import { CategoryFilterProvider } from './category-filter';
import Reveal from './reveal';
import { useStorefront } from './storefront-context';
import type { SectionType, StorefrontSection } from '@/lib/storefront/design';
import About from './sections/about';
import AnnouncementBar from './sections/announcement-bar';
import Hero from './sections/hero';
import Categories from './sections/categories';
import Cta from './sections/cta';
import Faq from './sections/faq';
import Featured from './sections/featured';
import Gallery from './sections/gallery';
import ImageText from './sections/image-text';
import Info from './sections/info';
import Products from './sections/products';
import Socials from './sections/socials';
import Testimonials from './sections/testimonials';

type Registry = { [K in SectionType]: ComponentType<{ section: Extract<StorefrontSection, { type: K }> }> };

/** Section type → component. Adding a section to the library is one entry here (plus its type in lib/storefront/design.ts). */
const REGISTRY: Registry = {
  announcement: AnnouncementBar,
  hero: Hero,
  products: Products,
  about: About,
  info: Info,
  featured: Featured,
  categories: Categories,
  imageText: ImageText,
  gallery: Gallery,
  faq: Faq,
  testimonials: Testimonials,
  cta: Cta,
  socials: Socials,
};

/** Sections that sit at the very top of a page: they are on screen at once, so they are never scroll-revealed. */
const ABOVE_THE_FOLD: SectionType[] = ['announcement', 'hero'];

/** Renders a page's sections in order, skipping hidden ones and any type this version doesn't know. */
export default function SectionList({ sections }: { sections: StorefrontSection[] }) {
  // In the editor preview every section stays put, so what the seller is editing never hides itself.
  const { preview } = useStorefront();
  let rendered = 0;
  return (
    // One provider per page, so category chips only filter the products section on the same page.
    <CategoryFilterProvider>
      {sections.map((section) => {
        if (section.hidden) return null;
        const Component = REGISTRY[section.type] as ComponentType<{ section: StorefrontSection }> | undefined;
        if (!Component) return null;
        // The first two sections are above the fold on any screen; the rest rise in as they scroll into view.
        const index = rendered++;
        return (
          <Reveal key={section.id} disabled={preview || index < 2 || ABOVE_THE_FOLD.includes(section.type)}>
            <Component section={section} />
          </Reveal>
        );
      })}
    </CategoryFilterProvider>
  );
}
