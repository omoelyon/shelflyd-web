'use client';

import { createContext, useContext, useMemo, useState } from 'react';

interface CategoryFilterValue {
  /** The category the shopper picked with the chips, or null for "All". */
  category: number | null;
  setCategory: (category: number | null) => void;
}

const CategoryFilterContext = createContext<CategoryFilterValue | null>(null);

/**
 * Shares the picked category between a page's category chips and its products section. SectionList wraps each page's
 * sections in one of these, so chips only ever filter the products on the same page.
 */
export function CategoryFilterProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategory] = useState<number | null>(null);
  const value = useMemo(() => ({ category, setCategory }), [category]);
  return <CategoryFilterContext.Provider value={value}>{children}</CategoryFilterContext.Provider>;
}

/** Outside a provider (a section rendered on its own) there is simply no filter. */
export function useCategoryFilter(): CategoryFilterValue {
  return useContext(CategoryFilterContext) ?? { category: null, setCategory: () => {} };
}
