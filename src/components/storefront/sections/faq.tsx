'use client';

import { ChevronDown } from 'lucide-react';
import type { FaqSection } from '@/lib/storefront/design';

/** Questions and answers as an accessible accordion (native details/summary: keyboard and screen-reader friendly). */
export default function Faq({ section }: { section: FaqSection }) {
  const { title, items } = section.props;
  if (items.length === 0) return null;
  return (
    <section aria-label={title || 'Questions'} className="max-w-7xl mx-auto px-4 pt-10">
      <div className="max-w-3xl">
        {title.trim() && <h2 className="mb-4 text-xl font-semibold">{title}</h2>}
        <div className="divide-y rounded-xl border bg-white">
          {items.map((item, i) => (
            <details key={`${item.question}-${i}`} className="sf-faq group px-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-sm font-medium outline-none transition-colors duration-200 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-180" aria-hidden="true" />
              </summary>
              {item.answer.trim() && <p className="whitespace-pre-line pb-4 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
