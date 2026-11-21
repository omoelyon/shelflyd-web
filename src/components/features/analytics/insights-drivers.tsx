'use client';

import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InsightDrivers } from '@/types/insights';
import { signedNaira } from './insights-format';

function Effect({ label, value }: { label: string; value: number }) {
  const flat = Math.round(value) === 0;
  return (
    <div className="rounded-xl bg-[#f8f9ff] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">{label}</p>
      <p
        className={cn(
          'font-heading text-lg font-bold tabular-nums',
          flat ? 'text-[#64748b]' : value > 0 ? 'text-[#059669]' : 'text-[#dc2626]',
        )}
      >
        {signedNaira(value)}
      </p>
    </div>
  );
}

/** "What changed": plain sentences about why revenue moved, and how much of it came from more orders versus bigger baskets. */
export default function InsightsDrivers({ drivers }: { drivers: InsightDrivers }) {
  const sentences = (drivers.summary ?? []).filter((s) => s && s.trim());
  return (
    <section className="rounded-2xl bg-white p-5 shadow-card-md" aria-labelledby="insights-drivers-title">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fffbeb]" aria-hidden="true">
          <Lightbulb className="h-4 w-4 text-[#d97706]" />
        </span>
        <h3 id="insights-drivers-title" className="font-heading text-sm font-bold text-[#091426]">
          What changed
        </h3>
      </div>
      {sentences.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {sentences.map((s) => (
            <li key={s} className="flex gap-2 text-sm leading-relaxed text-[#091426]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0058be]" aria-hidden="true" />
              {s}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[#64748b]">Nothing stands out compared with the earlier period.</p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Effect label="From order count" value={drivers.ordersEffect} />
        <Effect label="From average order" value={drivers.basketEffect} />
      </div>
    </section>
  );
}
