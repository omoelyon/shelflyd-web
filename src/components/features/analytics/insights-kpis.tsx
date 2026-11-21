'use client';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InsightMetric, InsightOverview } from '@/types/insights';
import { comparisonLabel, count, naira, pct, usable } from './insights-format';

type Kind = 'money' | 'count' | 'percent';

interface KpiSpec {
  key: string;
  label: string;
  kind: Kind;
  metric: InsightMetric | null | undefined;
  /** Whether a rise is good news (revenue) or bad news (cancellations, refunds). */
  goodWhen: 'up' | 'down';
}

function show(kind: Kind, value: number): string {
  if (kind === 'money') return naira(value);
  if (kind === 'percent') return `${value.toFixed(1)}%`;
  return count(value);
}

/** Up/down arrow with the percentage. Green when the move is good for the seller, red when it is not. */
function Delta({ metric, kind, goodWhen }: { metric: InsightMetric; kind: Kind; goodWhen: 'up' | 'down' }) {
  const noBaseline = metric.changePct == null && kind !== 'percent';
  if (noBaseline) {
    return metric.current > 0 ? (
      // Something that appears from nothing: good news for sales, bad news for cancellations and refunds.
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-semibold',
          goodWhen === 'down' ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#eff4ff] text-[#0058be]',
        )}
      >
        New
      </span>
    ) : (
      <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs font-semibold text-[#64748b]">No change</span>
    );
  }
  const value = kind === 'percent' ? metric.change : (metric.changePct ?? 0);
  const rounded = Math.round(Math.abs(value) * 10) / 10;
  if (rounded === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs font-semibold text-[#64748b]">
        <Minus className="h-3 w-3" aria-hidden="true" />
        No change
      </span>
    );
  }
  const up = value > 0;
  const good = (up && goodWhen === 'up') || (!up && goodWhen === 'down');
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
        good ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fef2f2] text-[#dc2626]',
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span className="sr-only">{up ? 'Up ' : 'Down '}</span>
      {kind === 'percent' ? `${rounded.toFixed(1)} pts` : pct(value)}
    </span>
  );
}

function KpiCard({ spec, against }: { spec: KpiSpec; against: string }) {
  const metric = usable(spec.metric);
  if (!metric) return null;
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">{spec.label}</p>
      <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-[#091426]">{show(spec.kind, metric.current)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Delta metric={metric} kind={spec.kind} goodWhen={spec.goodWhen} />
        <span className="text-xs text-[#64748b]">
          vs {show(spec.kind, metric.previous)} {against}
        </span>
      </div>
    </div>
  );
}

/** The headline numbers for the period, each with how it moved against the comparison period. */
export default function InsightsKpis({ overview }: { overview: InsightOverview }) {
  const m = overview.metrics;
  const against = comparisonLabel(overview);
  const specs: KpiSpec[] = [
    { key: 'revenue', label: 'Revenue', kind: 'money', metric: m.revenue, goodWhen: 'up' },
    { key: 'orders', label: 'Orders', kind: 'count', metric: m.orders, goodWhen: 'up' },
    { key: 'aov', label: 'Average order', kind: 'money', metric: m.averageOrderValue, goodWhen: 'up' },
    { key: 'units', label: 'Items sold', kind: 'count', metric: m.units, goodWhen: 'up' },
    { key: 'profit', label: 'Gross profit', kind: 'money', metric: m.grossProfit, goodWhen: 'up' },
    { key: 'margin', label: 'Gross margin', kind: 'percent', metric: m.grossMarginPct, goodWhen: 'up' },
    { key: 'new', label: 'New customers', kind: 'count', metric: m.newCustomers, goodWhen: 'up' },
    { key: 'returning', label: 'Returning customers', kind: 'count', metric: m.returningCustomers, goodWhen: 'up' },
    { key: 'cancelled', label: 'Cancelled orders', kind: 'count', metric: m.cancelledOrders, goodWhen: 'down' },
    { key: 'refunded', label: 'Refunded', kind: 'money', metric: m.refundedAmount, goodWhen: 'down' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {specs.map((spec) => (
        <KpiCard key={spec.key} spec={spec} against={against} />
      ))}
    </div>
  );
}
