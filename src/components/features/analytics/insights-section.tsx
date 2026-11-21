'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, LineChart, TriangleAlert } from 'lucide-react';
import { insightsApi } from '@/lib/api/insights';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { InsightCompare, InsightOverview, InsightRange } from '@/types/insights';
import InsightsChart from './insights-chart';
import InsightsDrivers from './insights-drivers';
import { lagosDate } from './insights-format';
import InsightsKpis from './insights-kpis';
import InsightsProducts from './insights-products';

const RANGES: { value: InsightRange; label: string; hint: string }[] = [
  { value: 'day', label: 'Day', hint: 'One day against the same weekday last week' },
  { value: 'week', label: 'Week', hint: 'The last 7 days against the 7 before' },
  { value: 'month', label: 'Month', hint: 'This month so far against the same days last month' },
];

/** A small pill switch: one option is pressed at a time. */
function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-[#f8f9ff] p-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
            value === o.value ? 'bg-[#091426] text-white shadow-sm' : 'text-[#64748b] hover:text-[#091426]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Margins are only as complete as the cost prices the seller has entered: say so, and point at where to fix it. */
function CostNotice({ overview }: { overview: InsightOverview }) {
  const coverage = overview.costCoveragePct;
  if (coverage == null || coverage >= 100) return null;
  const none = coverage <= 0;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-900">
          {none ? 'Add cost prices to see your profit' : `Profit and margins cover ${Math.round(coverage)}% of your sales`}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
          {none
            ? 'Once each product has what it costs you, we can show how much you make on every sale.'
            : 'Products without a cost price are left out of the profit and margin figures. Add the rest to see the full picture.'}
        </p>
      </div>
      <Link href="/dashboard/inventory" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-900 hover:underline">
        Add cost prices <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

/**
 * Day, week and month comparisons: the headline numbers against the period before, what changed and why, a chart of
 * this period over the last, and the products behind it. The comparisons use whole days (through yesterday by default),
 * so a day that is still in progress isn't set against a finished one.
 */
export default function InsightsSection() {
  const [range, setRange] = useState<InsightRange>('week');
  const [compare, setCompare] = useState<InsightCompare>('sameWeekday');
  const [throughToday, setThroughToday] = useState(false);

  // Lagos calendar dates; "yesterday" is the last complete day.
  const date = range === 'day' && throughToday ? lagosDate(0) : lagosDate(1);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['insights-overview', range, range === 'day' ? compare : null, date],
    queryFn: () => insightsApi.getOverview({ range, date, ...(range === 'day' && { compare }) }),
    staleTime: 60_000,
  });

  const m = data?.metrics;
  const quiet = !!m && !m.revenue?.current && !m.revenue?.previous && !m.orders?.current && !m.orders?.previous;

  return (
    <section className="space-y-4" aria-labelledby="insights-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="insights-title" className="font-heading text-lg font-bold text-[#091426]">
            How you&rsquo;re doing
          </h2>
          <p className="mt-0.5 text-sm text-[#64748b]">{RANGES.find((r) => r.value === range)?.hint}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {range === 'day' && (
            <>
              <Segmented
                label="Compare the day with"
                value={compare}
                onChange={setCompare}
                options={[
                  { value: 'sameWeekday', label: 'Last week' },
                  { value: 'previous', label: 'Day before' },
                ]}
              />
              <Segmented
                label="Which day"
                value={throughToday ? 'today' : 'yesterday'}
                onChange={(v) => setThroughToday(v === 'today')}
                options={[
                  { value: 'yesterday', label: 'Yesterday' },
                  { value: 'today', label: 'Today so far' },
                ]}
              />
            </>
          )}
          <Segmented label="Period" value={range} onChange={setRange} options={RANGES.map(({ value, label }) => ({ value, label }))} />
        </div>
      </div>

      {isLoading ? (
        <SectionSkeleton />
      ) : isError || !data ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl bg-white text-center text-[#64748b] shadow-card-md">
          <p className="text-sm">We couldn&rsquo;t load your comparisons.</p>
          <button type="button" onClick={() => refetch()} className="text-sm font-semibold text-[#0058be] hover:underline">
            Try again
          </button>
        </div>
      ) : quiet ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl bg-white text-center text-[#64748b] shadow-card-md">
          <LineChart className="h-8 w-8 text-[#cbd5e1]" aria-hidden="true" />
          <p className="text-sm font-medium text-[#091426]">No sales in this period or the one before</p>
          <p className="max-w-sm text-xs">Comparisons appear here once orders come in.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.range === 'day' && throughToday && <p className="text-xs text-[#64748b]">Today isn&rsquo;t over yet, so these numbers are still growing.</p>}
          <InsightsKpis overview={data} />
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <InsightsChart overview={data} />
            </div>
            <div className="lg:col-span-2">
              <InsightsDrivers drivers={data.drivers ?? { ordersEffect: 0, basketEffect: 0, summary: [] }} />
            </div>
          </div>
          <CostNotice overview={data} />
          <InsightsProducts overview={data} />
        </div>
      )}
    </section>
  );
}
