'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Business } from '@/types';

interface BusinessAvatarProps {
  business: Pick<Business, 'name' | 'logo' | 'themeColor'>;
  size?: number;
  className?: string;
}

function buildFallbackUrl(name: string, themeColor: string | null): string {
  const color = (themeColor ?? '#16a34a').replace('#', '');
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&background=${color}&color=fff&size=256&bold=true&format=png`;
}

export default function BusinessAvatar({ business, size = 40, className = '' }: BusinessAvatarProps) {
  const fallback = buildFallbackUrl(business.name, business.themeColor);
  const intended = business.logo ?? fallback;
  // Tracks which URL has already failed to load, rather than caching the resolved
  // src itself — that way a new `business.logo` (e.g. right after an upload) is
  // picked up on the next render instead of staying frozen at whatever URL this
  // component first mounted with.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null);
  const src = erroredSrc === intended ? fallback : intended;

  return (
    <Image
      src={src}
      alt={business.name}
      width={size}
      height={size}
      className={`object-cover rounded-lg ${className}`}
      onError={() => setErroredSrc(intended)}
      unoptimized
    />
  );
}
