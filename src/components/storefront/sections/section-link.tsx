'use client';

import type { CSSProperties, ReactNode } from 'react';
import { SfLink } from '../sf-link';

/**
 * A link a seller typed into a section: https links open in a new tab, paths stay on the site (and do nothing in
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
  if (/^https:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style} {...aria}>
        {children}
      </a>
    );
  }
  return (
    <SfLink href={href} className={className} style={style} {...aria}>
      {children}
    </SfLink>
  );
}
