'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, Eye, Package } from 'lucide-react';
import { analyticsApi } from '@/lib/api/analytics';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ProductAnalytics, ProductVisitDay, ProductVisitStat } from '@/types';

const PERIODS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
] as const;
type Period = (typeof PERIODS)[number]['days'];

const COLLAPSED_DAYS = 7;

const label = 'text-[10px] font-semibold text-[#64748b] uppercase tracking-[0.1em]';

/** "Today", "Yesterday", otherwise "Mon 17 Nov". `today` is the report's own last day, so it matches Lagos time. */
function dayLabel(date: string, today: string) {
  const d = parseISO(date);
  const diff = Math.round((parseISO(today).getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return format(d, 'EEE d MMM');
}

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

/** A tiny line of the product's daily views, so a climbing or fading product shows at a glance. */
function Sparkline({ series }: { series: number[] }) {
  const max = Math.max(...series, 1);
  const w = 64;
  const h = 22;
  const step = series.length > 1 ? w / (series.length - 1) : 0;
  const points = series.map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="hidden shrink-0 sm:block">
      <polyline points={points} fill="none" stroke="#0058be" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex items-center gap-1 bg-[#f8f9ff] rounded-xl p-1" role="group" aria-label="Time period">
      {PERIODS.map(({ label: text, days }) => (
        <button
          key={days}
          type="button"
          aria-pressed={value === days}
          onClick={() => onChange(days)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
            value === days ? 'bg-[#091426] text-white shadow-sm' : 'text-[#64748b] hover:text-[#091426]',
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** Up or down against the period before; "New" when there was nothing to compare with. */
function Change({ total, previous }: { total: number; previous: number }) {
  if (total === 0 && previous === 0) return null;
  if (previous === 0) {
    return <span className="rounded-full bg-[#eff4ff] px-2 py-0.5 text-xs font-semibold text-[#0058be]">New</span>;
  }
  const pct = Math.round(((total - previous) / previous) * 100);
  if (pct === 0) return <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs font-semibold text-[#64748b]">No change</span>;
  const up = pct > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
        up ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fef2f2] text-[#dc2626]',
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(pct)}%
    </span>
  );
}

interface ChartRow {
  date: string;
  label: string;
  views: number;
  top: ProductVisitDay['top'];
}

function VisitTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartRow }[] }) {
  const row = active ? payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <div className="max-w-56 rounded-xl bg-white px-3 py-2 text-xs shadow-[0_4px_20px_rgba(9,20,38,0.12)]">
      <p className="font-semibold text-[#091426]">{format(parseISO(row.date), 'EEE d MMM')}</p>
      <p className="text-[#64748b]">
        {row.views} {row.views === 1 ? 'visit' : 'visits'}
      </p>
      {row.top && <p className="mt-1 truncate text-[#091426]">Top: {row.top.name}</p>}
    </div>
  );
}

function DailyChart({ data }: { data: ProductAnalytics }) {
  const rows: ChartRow[] = data.daily.map((d) => ({
    date: d.date,
    label: format(parseISO(d.date), data.days <= 7 ? 'EEE' : 'd MMM'),
    views: d.views,
    top: d.top,
  }));
  return (
    <div role="img" aria-label={`Daily product visits, ${data.totalViews} in total over the last ${data.days} days`}>
      <ResponsiveContainer width="100%" height={176}>
        <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(9,20,38,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
          <Tooltip cursor={{ fill: 'rgba(0,88,190,0.06)' }} content={<VisitTooltip />} />
          <Bar dataKey="views" fill="#0058be" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RankedProducts({ products }: { products: ProductVisitStat[] }) {
  const max = Math.max(...products.map((p) => p.views), 1);
  return (
    <ol className="space-y-3">
      {products.map((p, i) => (
        <li key={p.productId} className="flex items-center gap-3">
          <span className="w-4 shrink-0 text-center text-xs font-semibold tabular-nums text-[#94a3b8]">{i + 1}</span>
          <Thumb src={p.image} name={p.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-[#091426]">{p.name}</p>
              {!p.available ? (
                <span className="shrink-0 rounded-full bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-medium text-[#64748b]">Removed</span>
              ) : (
                p.hidden && <span className="shrink-0 rounded-full bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-medium text-[#64748b]">Hidden</span>
              )}
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
              <div className="h-full rounded-full bg-[#0058be] transition-[width] duration-500 ease-out" style={{ width: `${Math.max((p.views / max) * 100, 3)}%` }} />
            </div>
          </div>
          <Sparkline series={p.series} />
          <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-[#091426]">{p.views.toLocaleString()}</span>
        </li>
      ))}
    </ol>
  );
}

function TopEachDay({ data }: { data: ProductAnalytics }) {
  const [showAll, setShowAll] = useState(false);
  // Newest first; a long period starts collapsed so the card stays a sensible size.
  const days = [...data.daily].reverse();
  const shown = showAll ? days : days.slice(0, COLLAPSED_DAYS);
  return (
    <div>
      <ul className="divide-y divide-[rgba(9,20,38,0.06)]">
        {shown.map((d) => (
          <li key={d.date} className="flex items-center justify-between gap-3 py-2.5">
            <span className="w-24 shrink-0 text-xs font-medium text-[#64748b]">{dayLabel(d.date, data.to)}</span>
            {d.top ? (
              <>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#091426]">{d.top.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-[#64748b]">
                  {d.top.views} of {d.views} {d.views === 1 ? 'visit' : 'visits'}
                </span>
              </>
            ) : (
              <span className="flex-1 text-sm text-[#94a3b8]">No visits</span>
            )}
          </li>
        ))}
      </ul>
      {days.length > COLLAPSED_DAYS && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-xs font-semibold text-[#0058be] hover:underline"
        >
          {showAll ? 'Show fewer days' : `Show all ${days.length} days`}
        </button>
      )}
    </div>
  );
}

/** "Product visits": how often shoppers open each product, and which one was the most visited on each day. */
export default function ProductVisits() {
  const [period, setPeriod] = useState<Period>(7);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['product-visits', period],
    queryFn: () => analyticsApi.getProductVisits(period),
    // Fresh enough for a dashboard, without refetching on every tab focus.
    staleTime: 60_000,
  });

  return (
    <section className="bg-white rounded-2xl shadow-card-md p-5" aria-labelledby="product-visits-title">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p id="product-visits-title" className={label}>
            Product visits
          </p>
          {data ? (
            <div className="mt-0.5 flex items-center gap-2.5">
              <p className="text-3xl font-bold text-[#091426] font-heading tabular-nums">{data.totalViews.toLocaleString()}</p>
              <Change total={data.totalViews} previous={data.previousViews} />
            </div>
          ) : (
            <Skeleton className="mt-1 h-9 w-24" />
          )}
          {data && data.totalViews > 0 && (
            <p className="mt-0.5 text-xs text-[#64748b]">vs {data.previousViews.toLocaleString()} in the {data.days} days before</p>
          )}
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : isError || !data ? (
        <div className="flex h-44 flex-col items-center justify-center gap-2 text-center text-[#64748b]">
          <p className="text-sm">We couldn’t load your product visits.</p>
          <button type="button" onClick={() => refetch()} className="text-sm font-semibold text-[#0058be] hover:underline">
            Try again
          </button>
        </div>
      ) : data.totalViews === 0 ? (
        <div className="flex h-44 flex-col items-center justify-center gap-2 text-center text-[#64748b]">
          <Eye className="h-8 w-8 text-[#cbd5e1]" />
          <p className="text-sm font-medium text-[#091426]">No product visits yet</p>
          <p className="max-w-sm text-xs">Each time a shopper opens one of your products it is counted here. Visits from you and your team are not counted.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <DailyChart data={data} />
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className={cn(label, 'mb-3')}>Most visited</h3>
              <RankedProducts products={data.products} />
            </div>
            <div>
              <h3 className={cn(label, 'mb-1')}>Top product each day</h3>
              <TopEachDay data={data} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
