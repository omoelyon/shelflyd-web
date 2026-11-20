'use client';

import { readableTextOn, type AnnouncementSection } from '@/lib/storefront/design';
import { SfLink } from '../sf-link';
import { useStorefront } from '../storefront-context';

/** A thin full-width strip in the brand colour for a promo or notice ("Free delivery over ₦20,000"). */
export default function AnnouncementBar({ section }: { section: AnnouncementSection }) {
  const { design } = useStorefront();
  const { text, link } = section.props;
  if (!text.trim()) return null;
  const style = { backgroundColor: design.theme.primary, color: readableTextOn(design.theme.primary) };
  const content = <span className="font-medium">{text}</span>;
  const className = 'block px-4 py-2 text-center text-sm';
  if (!link.trim()) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }
  const external = /^https?:\/\//i.test(link);
  return external ? (
    <a href={link} target="_blank" rel="noopener noreferrer" className={`${className} hover:opacity-90`} style={style}>
      {content}
    </a>
  ) : (
    <SfLink href={link} className={`${className} hover:opacity-90`} style={style}>
      {content}
    </SfLink>
  );
}
