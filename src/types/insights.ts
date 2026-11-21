// Types for the seller insights (day / week / month comparisons) and the daily brief.
// Mirrors the API contract for /business/insights/** and /business/settings/daily-brief.

export type InsightRange = 'day' | 'week' | 'month';
export type InsightCompare = 'previous' | 'sameWeekday';

/** One figure for the period and for the period it is compared with. `changePct` is in percent (12.5 = 12.5%); null when there is nothing to compare with. */
export interface InsightMetric {
  current: number;
  previous: number;
  change: number;
  changePct: number | null;
}

export interface InsightPeriod {
  from: string; // YYYY-MM-DD, Lagos time
  to: string;
  label: string;
}

export interface InsightMetrics {
  revenue: InsightMetric;
  orders: InsightMetric;
  units: InsightMetric;
  averageOrderValue: InsightMetric;
  newCustomers: InsightMetric;
  returningCustomers: InsightMetric;
  cancelledOrders: InsightMetric;
  refundedAmount: InsightMetric;
  /** Null (or missing) until the seller has entered cost prices. */
  grossProfit?: InsightMetric | null;
  /** Percentage points when compared: `change` is the difference in points. */
  grossMarginPct?: InsightMetric | null;
}

export interface InsightSeriesPoint {
  label: string;
  current: number | null;
  previous: number | null;
}

export interface InsightDrivers {
  /** Revenue effect (naira) of selling more or fewer orders. */
  ordersEffect: number;
  /** Revenue effect (naira) of bigger or smaller baskets. */
  basketEffect: number;
  /** Plain sentences, e.g. "Orders fell 5% and the average order fell 14%". */
  summary: string[];
}

export interface InsightProduct {
  productId: number;
  name: string;
  image: string | null;
  revenue: number;
  units: number;
  previousRevenue: number;
  change: number;
  /** Null when no cost price is known for the product. */
  marginPct: number | null;
}

export interface InsightOverview {
  range: InsightRange;
  compare: InsightCompare;
  current: InsightPeriod;
  previous: InsightPeriod;
  metrics: InsightMetrics;
  series: InsightSeriesPoint[];
  drivers: InsightDrivers;
  topProducts: InsightProduct[];
  movers: { up: InsightProduct[]; down: InsightProduct[] };
  /** Share (percent) of revenue that came from products with a cost price. */
  costCoveragePct: number | null;
}

// ─── Daily brief ──────────────────────────────────────────────────────────────

export interface BriefFigure {
  value: number;
  sameWeekdayLastWeek: number;
  changePct: number | null;
}

export interface BriefRunningOut {
  productId: number;
  name: string;
  daysOfCover: number | null;
  onHand: number;
  baseUnit: string;
}

export interface Brief {
  /** Yesterday, YYYY-MM-DD (Lagos time). */
  date: string;
  headline: string;
  revenue: BriefFigure;
  orders: BriefFigure;
  needsAction: {
    ordersToProcess: number;
    ordersReadyToDispatch: number;
    outOfStock: number;
    lowStock: number;
  };
  runningOut: BriefRunningOut[];
  highlights: string[];
  topProduct: { productId?: number; name: string; revenue?: number; units?: number } | null;
}

export interface BriefSetting {
  enabled: boolean;
}
