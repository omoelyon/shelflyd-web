'use client';

import type { ComponentType } from 'react';
import { CategoryFilterProvider } from './category-filter';
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

/** Renders a page's sections in order, skipping hidden ones and any type this version doesn't know. */
export default function SectionList({ sections }: { sections: StorefrontSection[] }) {
  return (
    // One provider per page, so category chips only filter the products section on the same page.
    <CategoryFilterProvider>
      {sections.map((section) => {
        if (section.hidden) return null;
        const Component = REGISTRY[section.type] as ComponentType<{ section: StorefrontSection }> | undefined;
        return Component ? <Component key={section.id} section={section} /> : null;
      })}
    </CategoryFilterProvider>
  );
}
