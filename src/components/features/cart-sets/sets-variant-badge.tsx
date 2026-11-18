'use client';

import { useState } from 'react';
import { setSetsVariant, useSetsVariant, type SetsVariant } from '@/lib/cart-sets';
import { cn } from '@/lib/utils';

const OPTIONS: { value: SetsVariant; label: string }[] = [
  { value: '1', label: 'Design 1' },
  { value: '2', label: 'Design 2' },
  { value: 'both', label: 'Both' },
  { value: 'off', label: 'Off' },
];

/**
 * Test switch for the cart-sets designs. It only appears once a tester has picked a design
 * (open any page with ?sets=1, ?sets=2, ?sets=both or ?sets=off), so shoppers never see it.
 * It sits on the left edge as a small collapsed tab so it never covers a page's own buttons.
 */
export default function SetsVariantBadge() {
  const { variant, overridden } = useSetsVariant();
  const [open, setOpen] = useState(false);
  if (!overridden) return null;
  const current = OPTIONS.find((o) => o.value === variant)?.label ?? variant;
  return (
    <div role="group" aria-label="Cart sets test design" className="fixed left-0 top-1/2 z-[60] flex -translate-y-1/2 items-stretch text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-r-lg border border-l-0 bg-primary px-1 py-3 font-medium text-primary-foreground shadow-md [writing-mode:vertical-rl]"
      >
        Sets test · {current}
      </button>
      {open && (
        <div className="ml-1 flex flex-col gap-1 rounded-xl border bg-background p-1.5 shadow-md">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                setSetsVariant(o.value);
                setOpen(false);
              }}
              aria-pressed={variant === o.value}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-left transition-colors',
                variant === o.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              {o.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setSetsVariant(null);
              setOpen(false);
            }}
            className="rounded-lg px-2.5 py-1.5 text-left text-muted-foreground hover:bg-muted"
            aria-label="Clear the test design and use the default"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
