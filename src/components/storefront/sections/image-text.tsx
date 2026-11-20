'use client';

import Image from 'next/image';
import { readableTextOn, type ImageTextSection } from '@/lib/storefront/design';
import { cn } from '@/lib/utils';
import { useStorefront } from '../storefront-context';
import SectionLink from './section-link';

/** A photo beside a heading, some text and an optional button. On phones the photo comes first. */
export default function ImageText({ section }: { section: ImageTextSection }) {
  const { design } = useStorefront();
  const { heading, body, image, buttonLabel, buttonLink } = section.props;
  const hasImage = !!image.trim();
  const hasText = !!(heading.trim() || body.trim() || (buttonLabel.trim() && buttonLink.trim()));
  if (!hasImage && !hasText) return null;
  const primary = design.theme.primary;

  const text = hasText && (
    <div className={cn('max-w-xl', !hasImage && 'max-w-3xl')}>
      {heading.trim() && <h2 className="text-2xl font-semibold">{heading}</h2>}
      {body.trim() && <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{body}</p>}
      {buttonLabel.trim() && buttonLink.trim() && (
        <SectionLink
          href={buttonLink}
          className="mt-5 inline-flex h-10 items-center rounded-lg px-5 text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: primary, color: readableTextOn(primary) }}
        >
          {buttonLabel}
        </SectionLink>
      )}
    </div>
  );

  return (
    <section aria-label={heading.trim() || 'Image and text'} className="max-w-7xl mx-auto px-4 pt-10">
      <div className={cn('grid items-center gap-6 md:gap-10', hasImage && hasText && 'md:grid-cols-2')}>
        {hasImage && (
          <div className={cn('relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted', section.variant === 'right' && 'md:order-2')}>
            <Image src={image} alt={heading.trim()} fill className="object-cover" unoptimized />
          </div>
        )}
        {text}
      </div>
    </section>
  );
}
