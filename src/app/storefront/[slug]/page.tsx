'use client';

import SectionList from '@/components/storefront/section-renderer';
import { useStorefront } from '@/components/storefront/storefront-context';

/** The storefront home page is whatever sections the business's design lists (Classic: a hero and the products). */
export default function StorefrontHomePage() {
  const { design } = useStorefront();
  return (
    <div className="pb-10">
      <SectionList sections={design.pages.home.sections} />
    </div>
  );
}
