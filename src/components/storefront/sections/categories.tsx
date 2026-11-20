'use client';

import { useQuery } from '@tanstack/react-query';
import { storefrontApi } from '@/lib/api/storefront';
import { readableTextOn, type CategoriesSection } from '@/lib/storefront/design';
import { cn } from '@/lib/utils';
import { useCategoryFilter } from '../category-filter';
import { useStorefront } from '../storefront-context';

/** Chips that filter the products section on the same page by category. Hidden when the store has no categories. */
export default function Categories({ section }: { section: CategoriesSection }) {
  const { slug, design } = useStorefront();
  const { category, setCategory } = useCategoryFilter();
  const { title, showAll } = section.props;
  const { data: categories } = useQuery({
    queryKey: ['storefront', slug, 'categories'],
    queryFn: () => storefrontApi.getCategories(slug),
    enabled: !!slug,
  });

  if (!categories?.length) return null;

  const primary = design.theme.primary;
  const chip = (selected: boolean) =>
    cn(
      'shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium outline-none transition-[color,background-color,border-color,transform,translate,scale] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/50',
      selected ? 'border-transparent' : 'bg-white text-muted-foreground hover:text-foreground',
    );
  const chipStyle = (selected: boolean) => (selected ? { backgroundColor: primary, color: readableTextOn(primary) } : undefined);

  return (
    <section aria-label={title || 'Categories'} className="max-w-7xl mx-auto px-4 pt-10">
      {title.trim() && <h2 className="mb-4 text-xl font-semibold">{title}</h2>}
      <div role="group" aria-label="Filter products by category" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {showAll && (
          <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)} className={chip(category === null)} style={chipStyle(category === null)}>
            All
          </button>
        )}
        {categories.map((c) => {
          const selected = category === c.id;
          return (
            <button key={c.id} type="button" aria-pressed={selected} onClick={() => setCategory(selected && !showAll ? null : c.id)} className={chip(selected)} style={chipStyle(selected)}>
              {c.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
