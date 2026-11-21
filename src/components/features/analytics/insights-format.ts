import { format, parseISO } from 'date-fns';
import type { InsightMetric, InsightOverview } from '@/types/insights';

const LAGOS = 'Africa/Lagos';

/** A calendar date in Lagos time as YYYY-MM-DD. `daysAgo` 0 is today, 1 is yesterday. (Lagos has no daylight saving, so 24 hours is a day.) */
export function lagosDate(daysAgo = 0): string {
  const when = new Date(Date.now() - daysAgo * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: LAGOS, year: 'numeric', month: '2-digit', day: '2-digit' }).format(when);
}

export function naira(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

/** "+₦1,200" / "−₦300": a signed naira amount. */
export function signedNaira(value: number): string {
  if (!Number.isFinite(value) || Math.round(value) === 0) return '₦0';
  return `${value > 0 ? '+' : '−'}₦${Math.abs(Math.round(value)).toLocaleString('en-NG')}`;
}

export function count(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-NG', { maximumFractionDigits: 1 });
}

/** "12%" below 100 with one decimal when small ("4.5%"). Always without sign. */
export function pct(value: number): string {
  const abs = Math.abs(value);
  return `${abs.toFixed(abs >= 10 ? 0 : 1)}%`;
}

/** The metric if the server sent it with usable numbers, else null. */
export function usable(metric: InsightMetric | null | undefined): InsightMetric | null {
  if (!metric || typeof metric.current !== 'number') return null;
  return metric;
}

/** What the comparison is against, in words that fit after "vs": "last Friday", "the day before", "the previous 7 days", "the same days last month". */
export function comparisonLabel(overview: Pick<InsightOverview, 'range' | 'compare' | 'previous'>): string {
  if (overview.range === 'day') {
    if (overview.compare === 'previous') return 'the day before';
    try {
      return `last ${format(parseISO(overview.previous.from), 'EEEE')}`;
    } catch {
      return overview.previous.label;
    }
  }
  return overview.range === 'week' ? 'the previous 7 days' : 'the same days last month';
}
