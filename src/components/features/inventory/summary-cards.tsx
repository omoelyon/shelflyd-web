import Link from 'next/link';
import { AlertTriangle, Boxes, PackageX, Wallet } from 'lucide-react';
import StatCard from '@/components/ui/stat-card';
import type { CoverSummary } from '@/types/inventory';
import { formatNaira } from './format';

/** Stock value, what is out and what is about to run out; plus a nudge when some products have no cost price. */
export default function SummaryCards({ summary }: { summary: CoverSummary }) {
  const runningLow = summary.critical + summary.low;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Stock value (at cost)" value={summary.totalStockValue != null ? formatNaira(Math.round(summary.totalStockValue)) : '—'} accent="#059669" bg="#ecfdf5" />
        <StatCard icon={PackageX} label="Out of stock" value={summary.outOfStock} accent="#dc2626" bg="#fef2f2" />
        <StatCard icon={AlertTriangle} label="Running low" value={runningLow} accent="#d97706" bg="#fffbeb" />
        <StatCard icon={Boxes} label="Products tracked" value={summary.trackedProducts} />
      </div>
      {summary.unvaluedProducts > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900" role="note">
          {summary.unvaluedProducts} {summary.unvaluedProducts === 1 ? 'product has' : 'products have'} no cost price, so {summary.unvaluedProducts === 1 ? 'its' : 'their'} value is missing from the total.{' '}
          <Link href="/dashboard/products" className="font-semibold underline underline-offset-2">
            Add cost prices
          </Link>{' '}
          to see your real stock value and profit.
        </p>
      )}
    </div>
  );
}
