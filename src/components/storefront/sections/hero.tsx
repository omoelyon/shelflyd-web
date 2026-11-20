'use client';

import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { readableTextOn, type HeroSection } from '@/lib/storefront/design';
import { useStorefront } from '../storefront-context';

export default function Hero({ section }: { section: HeroSection }) {
  const { info, isLoading, design } = useStorefront();
  const primary = design.theme.primary;

  if (isLoading) {
    return section.variant === 'banner' ? (
      <Skeleton className="h-72 rounded-none" />
    ) : (
      <div className="max-w-7xl mx-auto px-4 pt-10">
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }
  if (!info) return null;

  const { props } = section;
  const heading = props.heading.trim() || info.name;
  const tagline = props.tagline.trim() || info.description || '';
  const location = props.location.trim();

  if (section.variant === 'banner') {
    const hasImage = !!props.image.trim();
    const ink = hasImage ? '#ffffff' : readableTextOn(primary);
    return (
      <section aria-label={heading} className="relative flex min-h-[18rem] items-end overflow-hidden sm:min-h-[22rem]" style={{ backgroundColor: primary }}>
        {hasImage && (
          <>
            <Image src={props.image} alt="" fill className="object-cover" unoptimized priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" aria-hidden="true" />
          </>
        )}
        <div className="relative mx-auto w-full max-w-7xl px-4 py-10" style={{ color: ink }}>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold sm:text-5xl">{heading}</h1>
            {props.showOpenBadge && <Badge className="bg-white/90 text-[#0b1220]">Open</Badge>}
          </div>
          {tagline && <p className="mt-3 max-w-xl text-base opacity-90 sm:text-lg">{tagline}</p>}
          {location && (
            <div className="mt-3 flex items-center gap-1 text-sm opacity-90">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>{location}</span>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-10">
      <div
        className="rounded-2xl p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start"
        style={{ background: `${primary}15` }}
      >
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start mb-2">
            <h1 className="text-3xl font-bold">{heading}</h1>
            {props.showOpenBadge && (
              <Badge style={{ backgroundColor: primary, color: readableTextOn(primary) }}>Open</Badge>
            )}
          </div>
          {tagline && <p className="text-muted-foreground max-w-xl">{tagline}</p>}
          {location && (
            <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground justify-center sm:justify-start">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>{location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
