'use client';

import type { CSSProperties, ReactNode } from 'react';
import { SfLink } from '../sf-link';
import { useStorefront } from '../storefront-context';

/** A path a seller typed ("/", "/p/delivery", "/cart") as a link inside this store. Prefixed with the store's own path; on a store's own domain the proxy turns that into the clean URL. */
export function storePath(slug: string, href: string): string {
  const base = `/storefront/${slug}`;
  if (href === base || href.startsWith(`${base}/`) || href.startsWith(`${base}?`)) return href;
  return href === '/' ? base : `${base}${href}`;
}

/**
 * A link a seller typed into a section: https links open in a new tab, paths stay in this store (and do nothing in
 * the editor preview). The server only ever stores https links and /paths, so nothing else reaches here.
 */
export default function SectionLink({
  href,
  className,
  style,
  children,
  ...aria
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  'aria-label'?: string;
}) {
  const { slug } = useStorefront();
  if (/^https:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style} {...aria}>
        {children}
      </a>
    );
  }
  return (
    <SfLink href={storePath(slug, href)} className={className} style={style} {...aria}>
      {children}
    </SfLink>
  );
}
