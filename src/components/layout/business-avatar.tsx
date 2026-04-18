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
  const [src, setSrc] = useState<string>(business.logo ?? fallback);

  return (
    <Image
      src={src}
      alt={business.name}
      width={size}
      height={size}
      className={`object-cover rounded-lg ${className}`}
      onError={() => setSrc(fallback)}
      unoptimized
    />
  );
}
