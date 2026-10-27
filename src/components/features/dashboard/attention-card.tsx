'use client';

import Link from 'next/link';
import { BellRing, ArrowRight } from 'lucide-react';
import type { BusinessStats } from '@/types';

/** Amber nudge for orders waiting on the seller. Renders nothing when nothing needs them. */
export default function AttentionCard({ stats }: { stats: BusinessStats }) {
  const toPrepare = stats.paidOrders;
  const ready = stats.readyForPickupOrders + stats.readyForDeliveryOrders;
  const total = toPrepare + ready;
  if (total === 0) return null;

  const parts = [
    toPrepare > 0 ? `${toPrepare} to prepare` : null,
    ready > 0 ? `${ready} ready to hand over` : null,
  ].filter(Boolean);

  return (
    <Link
      href="/dashboard/orders"
      className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 hover:border-amber-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0" aria-hidden="true">
        <BellRing className="h-5 w-5 text-amber-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          {total === 1 ? '1 order needs you' : `${total} orders need you`}
        </p>
        <p className="text-xs text-amber-800 mt-0.5">{parts.join(' · ')}</p>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 shrink-0">
        Open orders <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
