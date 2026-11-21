'use client';

import { useState } from 'react';
import { Boxes, Download, FileSpreadsheet, HandCoins, Loader2, Receipt, ShoppingBag, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { financeApi } from '@/lib/api/finance';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExportKind } from '@/types/finance';
import PeriodPicker from './period-picker';
import { isValidPeriod, periodFor, type Period } from './periods';

interface Report {
  kind: ExportKind;
  title: string;
  icon: LucideIcon;
  /** What is in the file. */
  contents: string;
  /** Who it helps and what for. */
  useFor: string;
  /** False for a report that is a snapshot of now, so the date range does not apply. */
  usesDates: boolean;
}

const REPORTS: Report[] = [
  {
    kind: 'sales',
    title: 'Sales',
    icon: ShoppingBag,
    contents: 'One row for every item sold: the order, date, status, buyer, product, quantity, price, delivery and service fees.',
    useFor: 'Your accountant records your sales and works out VAT from this.',
    usesDates: true,
  },
  {
    kind: 'payouts',
    title: 'Payouts & fees',
    icon: HandCoins,
    contents: 'One row for every paid order: items total, delivery, platform commission, gateway fee, refunds and what you received.',
    useFor: 'Matching what you earned to the money that reached your bank account.',
    usesDates: true,
  },
  {
    kind: 'stock-movements',
    title: 'Stock movements',
    icon: Boxes,
    contents: 'Every time stock went up or down: sales, restocks, corrections and cancelled orders, with the reason and the balance after.',
    useFor: 'Stock counts, finding where stock went missing, and an audit trail.',
    usesDates: true,
  },
  {
    kind: 'inventory-valuation',
    title: 'Inventory valuation',
    icon: FileSpreadsheet,
    contents: 'Each product with the quantity on hand, what it cost you, the value of that stock and its selling price.',
    useFor: 'The value of the stock you hold, for your balance sheet. It shows today’s stock, so dates do not apply.',
    usesDates: false,
  },
  {
    kind: 'expenses',
    title: 'Expenses',
    icon: Receipt,
    contents: 'Every expense you recorded: date, category, who you paid, the amount and your note.',
    useFor: 'Your accountant claims costs against your income with this.',
    usesDates: true,
  },
];

export default function ReportsTab() {
  const [period, setPeriod] = useState<Period>(() => periodFor('this-month'));
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const valid = isValidPeriod(period);

  const download = async (report: Report) => {
    setBusy(report.kind);
    try {
      const name = await financeApi.downloadExport(report.kind, report.usesDates ? { from: period.from, to: period.to } : undefined);
      toast.success(`Downloaded ${name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not download this report.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm text-[#64748b]">
          Download your records as spreadsheets (CSV files that open in Excel or Google Sheets) to give to your accountant. Choose the period, then download what you need.
        </p>
        <PeriodPicker value={period} onChange={setPeriod} idPrefix="rep" />
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          const loading = busy === r.kind;
          const disabled = (r.usesDates && !valid) || busy !== null;
          return (
            <li key={r.kind} className="flex flex-col rounded-2xl bg-white p-5 shadow-card-md">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eff4ff]">
                  <Icon className="h-5 w-5 text-[#0058be]" />
                </span>
                <h3 className="text-base font-semibold text-[#091426] font-heading">{r.title}</h3>
              </div>
              <p className="mt-3 text-sm text-[#334155]">{r.contents}</p>
              <p className="mt-1.5 text-xs text-[#64748b]">{r.useFor}</p>

              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <span className="text-xs text-[#94a3b8]">{r.usesDates ? 'Uses the period above' : 'As of today'}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => download(r)}
                  aria-label={`Download ${r.title} as CSV`}
                  className={cn('h-8 text-xs', loading && 'pointer-events-none')}
                >
                  {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
                  {loading ? 'Preparing…' : 'Download CSV'}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
