'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useStorefront } from './storefront-context';

/** A storefront link that does nothing in the editor's preview, so clicking around never leaves the editor. */
export function SfLink({ onClick, ...rest }: ComponentProps<typeof Link>) {
  const { preview } = useStorefront();
  return (
    <Link
      {...rest}
      onClick={(e) => {
        if (preview) e.preventDefault();
        onClick?.(e);
      }}
    />
  );
}
