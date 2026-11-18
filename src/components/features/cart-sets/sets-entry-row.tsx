'use client';

import { Layers } from 'lucide-react';
import { useSetsVariant } from '@/lib/cart-sets';
import { BuildSetButton } from './set-builder-dialog';

/** Quiet prompt on a store page: for shoppers ordering the same combo for a team or event. Design 2 only. */
export default function SetsEntryRow({ businessId, businessName }: { businessId: number; businessName?: string }) {
  const { design2 } = useSetsVariant();
  if (!design2) return null;
  return (
    <div className="mb-6 flex flex-col gap-2 rounded-xl border border-dashed px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Layers className="mt-0.5 h-4 w-4 shrink-0 text-[#0058be]" aria-hidden="true" />
        Same combo for a team or event? Build one set, then choose how many.
      </p>
      <BuildSetButton businessId={businessId} businessName={businessName} appearance="outline" className="h-10 shrink-0" />
    </div>
  );
}
