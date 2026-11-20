'use client';

import { readableTextOn, type CtaSection } from '@/lib/storefront/design';
import { useStorefront } from '../storefront-context';
import SectionLink from './section-link';

/** A brand-colour band with a message and a button. */
export default function Cta({ section }: { section: CtaSection }) {
  const { design } = useStorefront();
  const { heading, text, buttonLabel, buttonLink } = section.props;
  const showButton = !!(buttonLabel.trim() && buttonLink.trim());
  if (!heading.trim() && !text.trim() && !showButton) return null;
  const primary = design.theme.primary;
  const ink = readableTextOn(primary);

  return (
    <section aria-label={heading.trim() || 'Call to action'} className="max-w-7xl mx-auto px-4 pt-10">
      <div className="flex flex-col items-center gap-4 rounded-2xl px-6 py-10 text-center sm:px-10" style={{ backgroundColor: primary, color: ink }}>
        {heading.trim() && <h2 className="text-balance text-2xl font-semibold sm:text-3xl">{heading}</h2>}
        {text.trim() && <p className="max-w-xl opacity-90">{text}</p>}
        {showButton && (
          <SectionLink
            href={buttonLink}
            className="inline-flex h-11 items-center rounded-lg px-6 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: ink, color: primary }}
          >
            {buttonLabel}
          </SectionLink>
        )}
      </div>
    </section>
  );
}
