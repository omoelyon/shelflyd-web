import { endOfMonth, format, startOfMonth, startOfYear, subDays, subMonths } from 'date-fns';

export type PeriodKey = 'this-month' | 'last-month' | 'last-30' | 'last-90' | 'this-year' | 'custom';

export interface Period {
  key: PeriodKey;
  /** YYYY-MM-DD */
  from: string;
  /** YYYY-MM-DD */
  to: string;
}

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'this-month', label: 'This month' },
  { key: 'last-month', label: 'Last month' },
  { key: 'last-30', label: 'Last 30 days' },
  { key: 'last-90', label: 'Last 90 days' },
  { key: 'this-year', label: 'This year' },
  { key: 'custom', label: 'Custom' },
];

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

/** The from/to dates for a preset, counted from `today`. "Custom" keeps whatever range it is given. */
export function periodFor(key: PeriodKey, today: Date = new Date(), custom?: { from: string; to: string }): Period {
  switch (key) {
    case 'this-month':
      return { key, from: ymd(startOfMonth(today)), to: ymd(today) };
    case 'last-month': {
      const prev = subMonths(today, 1);
      return { key, from: ymd(startOfMonth(prev)), to: ymd(endOfMonth(prev)) };
    }
    case 'last-30':
      return { key, from: ymd(subDays(today, 29)), to: ymd(today) };
    case 'last-90':
      return { key, from: ymd(subDays(today, 89)), to: ymd(today) };
    case 'this-year':
      return { key, from: ymd(startOfYear(today)), to: ymd(today) };
    default:
      return { key: 'custom', from: custom?.from ?? ymd(startOfMonth(today)), to: custom?.to ?? ymd(today) };
  }
}

/** A range is usable when both dates are filled and the start is not after the end. */
export function isValidPeriod(p: Pick<Period, 'from' | 'to'>): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(p.from) && /^\d{4}-\d{2}-\d{2}$/.test(p.to) && p.from <= p.to;
}

export const todayYmd = (): string => ymd(new Date());
