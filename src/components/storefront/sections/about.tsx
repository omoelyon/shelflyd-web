'use client';

import type { AboutSection } from '@/lib/storefront/design';

export default function About({ section }: { section: AboutSection }) {
  const { title, body } = section.props;
  if (!body.trim()) return null;
  return (
    <section aria-label={title || 'About us'} className="max-w-7xl mx-auto px-4 pt-10">
      <div className="max-w-3xl">
        <h2 className="text-xl font-semibold mb-3">{title || 'About us'}</h2>
        <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </section>
  );
}
