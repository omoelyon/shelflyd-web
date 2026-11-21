'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowDown, ArrowUp, Banknote, CheckCircle2, PiggyBank, Receipt, TrendingUp } from 'lucide-react';
import { financeApi } from '@/lib/api/finance';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/ui/stat-card';
import EmptyState from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import type { ProfitLoss, ProfitLossProduct } from '@/types/finance';
import { naira, nairaWhole, percent, shortDate } from './format';
import PeriodPicker from './period-picker';
import { isValidPeriod, periodFor, type Period } from './periods';

type Row = {
  label: string;
  /** What the row is: money in, money out, or a running total. */
  kind: 'in' | 'out' | 'total';
  value: number | null;
  note?: string;
  /** Shown instead of the amount when the value is not known yet. */
  missing?: string;
  action?: { label: string; onClick: () => void };
};

function breakdownRows(pl: ProfitLoss, onOpenExpenses: () => void): Row[] {
  return [
    {
      label: 'Revenue',
      kind: 'in',
      value: pl.revenue,
      // Revenue already leaves refunded orders out, so refunds are explained here rather than subtracted again below.
      note: pl.refunds > 0 ? `Sales from paid orders. ${naira(pl.refunds)} of refunded orders is not counted.` : 'Sales from paid orders',
    },
    { label: 'Platform fees', kind: 'out', value: pl.platformFees },
    { label: 'Payment fees', kind: 'out', value: pl.paymentFees },
    { label: 'Net sales', kind: 'total', value: pl.netSales },
    { label: 'Cost of goods sold', kind: 'out', value: pl.cogs, missing: 'Add cost prices to see this' },
    {
      label: 'Gross profit',
      kind: 'total',
      value: pl.grossProfit,
      note: pl.grossMarginPct != null ? `${percent(pl.grossMarginPct)} margin` : undefined,
      missing: 'Needs cost prices',
    },
    {
      label: 'Expenses',
      kind: 'out',
      value: pl.expenses.total,
      // Money spent on stock is already counted in the cost of goods sold, so it is left out here (and explained).
      note: (pl.stockPurchases ?? 0) > 0 ? `Not including ${naira(pl.stockPurchases ?? 0)} spent on stock, which is already in your cost of goods.` : undefined,
      action: { label: 'View expenses', onClick: onOpenExpenses },
    },
    { label: 'Net profit', kind: 'total', value: pl.netProfit, missing: 'Needs cost prices' },
  ];
}

function Breakdown({ pl, onOpenExpenses }: { pl: ProfitLoss; onOpenExpenses: () => void }) {
  const rows = breakdownRows(pl, onOpenExpenses);
  // Bars are drawn against the largest figure so the shape reads at a glance.
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value ?? 0)));

  return (
    <div className="bg-white rounded-2xl shadow-card-md p-5">
      <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-[0.1em]">Where the money went</p>
      <p className="mt-0.5 text-xs text-[#64748b]">
        {shortDate(pl.from)} to {shortDate(pl.to)}. Revenue, fees and refunds follow the same rules as your Earnings page.
      </p>

      <ul className="mt-4 divide-y divide-[rgba(9,20,38,0.06)]">
        {rows.map((r) => {
          const known = r.value != null;
          const width = known ? Math.max(Math.abs(r.value as number) / max, (r.value as number) !== 0 ? 0.02 : 0) * 100 : 0;
          const negativeTotal = r.kind === 'total' && known && (r.value as number) < 0;
          const barColor =
            r.kind === 'in' ? '#0058be' : r.kind === 'out' ? '#f87171' : negativeTotal ? '#dc2626' : r.label === 'Net profit' ? '#059669' : '#091426';
          return (
            <li key={r.label} className={cn('py-3', r.kind === 'total' && 'bg-[#f8f9ff]/60 -mx-5 px-5')}>
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn('text-sm', r.kind === 'total' ? 'font-bold text-[#091426]' : 'font-medium text-[#334155]')}>
                    {r.kind === 'out' && <span className="mr-1 text-[#94a3b8]" aria-hidden>−</span>}
                    {r.label}
                  </p>
                  {r.note && known && <p className="text-xs text-[#64748b]">{r.note}</p>}
                </div>
                {known ? (
                  <p
                    className={cn(
                      'shrink-0 text-sm tabular-nums',
                      r.kind === 'total' ? 'font-bold' : 'font-medium',
                      negativeTotal ? 'text-[#dc2626]' : 'text-[#091426]',
                    )}
                  >
                    {naira(r.value as number)}
                  </p>
                ) : (
                  <p className="shrink-0 text-xs text-[#94a3b8]">{r.missing ?? '—'}</p>
                )}
              </div>
              {known && (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]" aria-hidden>
                  <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${width}%`, backgroundColor: barColor }} />
                </div>
              )}
              {r.action && (
                <button type="button" onClick={r.action.onClick} className="mt-1 text-xs font-semibold text-[#0058be] hover:underline">
                  {r.action.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Tells the seller how complete the profit figures are, and what to do about the gaps. */
function CostCoverage({ pl }: { pl: ProfitLoss }) {
  const coverage = Math.max(0, Math.min(100, pl.costCoveragePct));
  if (pl.revenue <= 0) return null;

  if (coverage >= 100) {
    return (
      <div className="flex items-start gap-2.5 rounded-2xl bg-[#ecfdf5] p-4 text-sm text-[#065f46]">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Every sale in this period has a cost price, so your profit figures are complete.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#92400e]">
            {coverage === 0 ? 'Profit can’t be worked out yet' : 'Profit figures are incomplete'}
          </p>
          <p className="mt-0.5 text-xs text-[#92400e]">
            {coverage === 0
              ? 'None of the products you sold has a cost price. Add what each one costs you and your gross profit and net profit appear here.'
              : `Cost prices cover ${percent(coverage)} of your revenue. The products below are missing one, so their profit isn’t counted.`}
          </p>

          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#fde68a]"
            role="progressbar"
            aria-valuenow={Math.round(coverage)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Share of revenue with a cost price"
          >
            <div className="h-full rounded-full bg-[#d97706]" style={{ width: `${coverage}%` }} />
          </div>

          {pl.missingCostProducts.length > 0 && (
            <ul className="mt-3 space-y-1">
              {pl.missingCostProducts.slice(0, 6).map((p) => (
                <li key={p.productId} className="flex items-center justify-between gap-3 text-xs text-[#78350f]">
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 tabular-nums">{naira(p.revenue)} sold</span>
                </li>
              ))}
              {pl.missingCostProducts.length > 6 && (
                <li className="text-xs text-[#92400e]">and {pl.missingCostProducts.length - 6} more</li>
              )}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/dashboard/inventory" className="inline-flex h-8 items-center rounded-lg bg-[#091426] px-3 text-xs font-semibold text-white hover:bg-[#091426]/90">
              Add cost prices
            </Link>
            <Link href="/dashboard/products" className="inline-flex h-8 items-center rounded-lg border border-[#fcd34d] bg-white px-3 text-xs font-semibold text-[#92400e] hover:bg-[#fffbeb]">
              Open products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

type SortKey = 'revenue' | 'marginPct' | 'unitsSold';

function ProductTable({ products }: { products: ProfitLossProduct[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'desc' | 'asc' }>({ key: 'revenue', dir: 'desc' });

  const sorted = useMemo(() => {
    const factor = sort.dir === 'desc' ? -1 : 1;
    // Products with no margin yet always go to the bottom, whichever way the column is sorted.
    return [...products].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * factor;
    });
  }, [products, sort]);

  const header = (key: SortKey, label: string) => {
    const active = sort.key === key;
    const Arrow = sort.dir === 'desc' ? ArrowDown : ArrowUp;
    return (
      <button
        type="button"
        onClick={() => setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }))}
        className={cn('inline-flex items-center gap-1 font-semibold', active ? 'text-[#091426]' : 'text-[#64748b] hover:text-[#091426]')}
        aria-label={`Sort by ${label}`}
      >
        {label}
        {active && <Arrow className="h-3 w-3" />}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-card-md p-5">
      <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-[0.1em] mb-3">By product</p>
      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#64748b]">No product sales in this period.</p>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-[rgba(9,20,38,0.08)] text-left text-xs">
                <th className="pb-2 pr-3 font-semibold text-[#64748b]">Product</th>
                <th className="pb-2 pr-3 text-right">{header('unitsSold', 'Units')}</th>
                <th className="pb-2 pr-3 text-right">{header('revenue', 'Revenue')}</th>
                <th className="pb-2 pr-3 text-right font-semibold text-[#64748b]">Cost</th>
                <th className="pb-2 pr-3 text-right font-semibold text-[#64748b]">Margin</th>
                <th className="pb-2 text-right">{header('marginPct', 'Margin %')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.productId} className="border-b border-[rgba(9,20,38,0.05)] last:border-0">
                  <td className="py-2.5 pr-3 font-medium text-[#091426]">{p.name}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-[#334155]">{p.unitsSold.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-[#091426]">{naira(p.revenue)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-[#334155]">{p.cogs != null ? naira(p.cogs) : '—'}</td>
                  <td
                    className={cn(
                      'py-2.5 pr-3 text-right tabular-nums',
                      p.margin == null ? 'text-[#94a3b8]' : p.margin < 0 ? 'text-[#dc2626]' : 'text-[#091426]',
                    )}
                  >
                    {p.margin != null ? naira(p.margin) : '—'}
                  </td>
                  <td
                    className={cn(
                      'py-2.5 text-right tabular-nums font-semibold',
                      p.marginPct == null ? 'text-[#94a3b8]' : p.marginPct < 0 ? 'text-[#dc2626]' : p.marginPct < 15 ? 'text-[#d97706]' : 'text-[#059669]',
                    )}
                  >
                    {percent(p.marginPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ProfitLossTab({ onOpenExpenses }: { onOpenExpenses: () => void }) {
  const [period, setPeriod] = useState<Period>(() => periodFor('this-month'));
  const valid = isValidPeriod(period);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['finance', 'profit-loss', period.from, period.to],
    queryFn: () => financeApi.getProfitLoss(period.from, period.to),
    enabled: valid,
    staleTime: 60_000,
  });

  const cards = data
    ? [
        { label: 'Revenue', value: nairaWhole(data.revenue), icon: TrendingUp, accent: '#0058be', bg: '#eff4ff' },
        { label: 'Net sales', value: nairaWhole(data.netSales), icon: Receipt, accent: '#0891b2', bg: '#ecfeff' },
        {
          label: data.grossMarginPct != null ? `Gross profit · ${percent(data.grossMarginPct)}` : 'Gross profit',
          value: data.grossProfit != null ? nairaWhole(data.grossProfit) : '—',
          icon: PiggyBank,
          accent: '#059669',
          bg: '#ecfdf5',
        },
        {
          label: 'Net profit',
          value: data.netProfit != null ? nairaWhole(data.netProfit) : '—',
          icon: Banknote,
          accent: data.netProfit != null && data.netProfit < 0 ? '#dc2626' : '#d97706',
          bg: data.netProfit != null && data.netProfit < 0 ? '#fef2f2' : '#fffbeb',
        },
      ]
    : [];

  return (
    <div className="space-y-5">
      <PeriodPicker value={period} onChange={setPeriod} idPrefix="pl" />

      {!valid ? null : isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      ) : isError || !data ? (
        <div className="bg-white rounded-2xl shadow-card-md p-8 text-center">
          <p className="text-sm text-[#64748b]">We couldn’t load your profit and loss.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : data.revenue === 0 && data.expenses.total === 0 && data.byProduct.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card-md">
          <EmptyState
            icon={Receipt}
            title="Nothing to report for this period"
            subtitle="Once you have paid orders or recorded expenses in these dates, your profit and loss appears here."
          />
        </div>
      ) : (
        <div className={cn('space-y-5 transition-opacity', isFetching && 'opacity-70')} aria-busy={isFetching}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          <CostCoverage pl={data} />
          <Breakdown pl={data} onOpenExpenses={onOpenExpenses} />
          <ProductTable products={data.byProduct} />
        </div>
      )}
    </div>
  );
}
