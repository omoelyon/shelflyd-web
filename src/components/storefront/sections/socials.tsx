'use client';

import type { ReactNode } from 'react';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import type { SocialsSection } from '@/lib/storefront/design';
import SectionLink from './section-link';

const TikTok = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1 0-5.2c.27 0 .53.04.77.12V9.66a5.7 5.7 0 0 0-.77-.05 5.69 5.69 0 1 0 5.69 5.69V8.9a7.3 7.3 0 0 0 4.27 1.37V7.2a4.3 4.3 0 0 1-3.22-1.38Z" />
  </svg>
);
const XLogo = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);

/** A row of icon links to the business's social profiles; empty ones are skipped. */
export default function Socials({ section }: { section: SocialsSection }) {
  const { title, instagram, facebook, tiktok, x, youtube } = section.props;
  const links: { label: string; href: string; icon: ReactNode }[] = [
    { label: 'Instagram', href: instagram, icon: <Instagram className="h-5 w-5" aria-hidden="true" /> },
    { label: 'Facebook', href: facebook, icon: <Facebook className="h-5 w-5" aria-hidden="true" /> },
    { label: 'TikTok', href: tiktok, icon: TikTok },
    { label: 'X', href: x, icon: XLogo },
    { label: 'YouTube', href: youtube, icon: <Youtube className="h-5 w-5" aria-hidden="true" /> },
  ].filter((l) => l.href.trim());
  if (links.length === 0) return null;

  return (
    <section aria-label={title || 'Social links'} className="max-w-7xl mx-auto px-4 pt-10">
      {title.trim() && <h2 className="mb-4 text-xl font-semibold">{title}</h2>}
      <ul className="flex flex-wrap gap-3">
        {links.map((l) => (
          <li key={l.label}>
            <SectionLink
              href={l.href}
              aria-label={`${l.label} (opens in a new tab)`}
              className="flex h-11 w-11 items-center justify-center rounded-full border bg-white text-muted-foreground outline-none transition-[color,border-color,transform,translate,scale,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-sm active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {l.icon}
            </SectionLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
