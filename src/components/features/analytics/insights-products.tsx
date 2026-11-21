'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowDownRight, ArrowUpRight, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InsightOverview, InsightProduct } from '@/types/insights';
import { comparisonLabel, count, naira, signedNaira } from './insights-format';

function Thumb({ src, name }: { src: string | null; name: string }) {
  // A photo that no longer loads falls back to the same box icon as a product with no photo.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src && failedSrc !== src;
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f1f5f9]">
      {showImage ? (
        <Image src={src} alt="" fill sizes="40px" className="object-cover" unoptimized onError={() => setFailedSrc(src)} />
      ) : (
        <Package className="h-4 w-4 text-[#94a3b8]" aria-label={name} />
      )}
    </span>
  );
}

function Margin({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <span className="text-[11px] text-[#94a3b8]" title="Add a cost price to see the margin">
        no cost yet
      </span>
    );
  }
  const tone = value >= 30 ? 'bg-[#ecfdf5] text-[#059669]' : value >= 10 ? 'bg-[#fffbeb] text-[#d97706]' : 'bg-[#fef2f2] text-[#dc2626]';
  return <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums', tone)}>{value.toFixed(0)}% margin</span>;
}

function TopProducts({ products, against }: { products: InsightProduct[]; against: string }) {
  const max = Math.max(...products.map((p) => p.revenue), 1);
  return (
    <section className="rounded-2xl bg-white p-5 shadow-card-md" aria-labelledby="insights-top-title">
      <h3 id="insights-top-title" className="mb-3 font-heading text-sm font-bold text-[#091426]">
        Top products
      </h3>
      <ol className="space-y-3">
        {products.map((p, i) => (
          <li key={p.productId} className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-center text-xs font-semibold tabular-nums text-[#94a3b8]">{i + 1}</span>
            <Thumb src={p.image} name={p.name} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="truncate text-sm font-medium text-[#091426]">{p.name}</p>
                <Margin value={p.marginPct} />
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
                <div className="h-full rounded-full bg-[#0058be] transition-[width] duration-500 ease-out" style={{ width: `${Math.max((p.revenue / max) * 100, 3)}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-[#64748b]">
                {count(p.units)} sold · {signedNaira(p.change)} vs {against}
              </p>
            </div>
            <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-[#091426]">{naira(p.revenue)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MoverList({ title, products, up }: { title: string; products: InsightProduct[]; up: boolean }) {
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <div>
      <h4 className={cn('mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em]', up ? 'text-[#059669]' : 'text-[#dc2626]')}>
        <Icon className="h-3 w-3" aria-hidden="true" />
        {title}
      </h4>
      {products.length === 0 ? (
        <p className="text-xs text-[#94a3b8]">None this time.</p>
      ) : (
        <ul className="space-y-1.5">
          {products.map((p) => (
            <li key={p.productId} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate text-[#091426]">{p.name}</span>
              <span className={cn('shrink-0 text-xs font-semibold tabular-nums', up ? 'text-[#059669]' : 'text-[#dc2626]')}>{signedNaira(p.change)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The best sellers (with margin where a cost price is known) and the products whose sales moved the most. */
export default function InsightsProducts({ overview }: { overview: InsightOverview }) {
  const against = comparisonLabel(overview);
  const top = overview.topProducts ?? [];
  const up = overview.movers?.up ?? [];
  const down = overview.movers?.down ?? [];
  if (top.length === 0 && up.length === 0 && down.length === 0) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {top.length > 0 && (
        <div className="lg:col-span-2">
          <TopProducts products={top} against={against} />
        </div>
      )}
      {(up.length > 0 || down.length > 0) && (
        <section className={cn('rounded-2xl bg-white p-5 shadow-card-md', top.length === 0 && 'lg:col-span-3')} aria-labelledby="insights-movers-title">
          <h3 id="insights-movers-title" className="mb-3 font-heading text-sm font-bold text-[#091426]">
            Biggest movers
          </h3>
          <div className="space-y-4">
            <MoverList title="Up" products={up} up />
            <MoverList title="Down" products={down} up={false} />
          </div>
        </section>
      )}
    </div>
  );
}
