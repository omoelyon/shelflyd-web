'use client';

import { Quote } from 'lucide-react';
import type { TestimonialsSection } from '@/lib/storefront/design';
import { cn } from '@/lib/utils';
import { stagger } from '../motion';

/** Short quotes from customers, as cards. */
export default function Testimonials({ section }: { section: TestimonialsSection }) {
  const { title, items } = section.props;
  if (items.length === 0) return null;
  return (
    <section aria-label={title || 'What customers say'} className="max-w-7xl mx-auto px-4 pt-10">
      {title.trim() && <h2 className="mb-6 text-xl font-semibold">{title}</h2>}
      <ul className={cn('grid gap-4', items.length === 1 ? 'max-w-xl' : items.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3')}>
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`} className="sf-rise" style={stagger(i)}>
            <figure className="flex h-full flex-col rounded-2xl border bg-white p-5">
              <Quote className="h-5 w-5 text-primary" aria-hidden="true" />
              <blockquote className="mt-3 flex-1 whitespace-pre-line text-sm leading-relaxed">{item.quote}</blockquote>
              {item.name.trim() && <figcaption className="mt-4 text-xs font-medium text-muted-foreground">— {item.name}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
