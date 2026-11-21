'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Receipt, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { financeApi } from '@/lib/api/finance';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/empty-state';
import PaginationControls from '@/components/ui/pagination-controls';
import { cn, getApiError } from '@/lib/utils';
import type { Expense, ExpenseCategory, ExpenseSummary } from '@/types/finance';
import ExpenseDialog from './expense-dialog';
import { categoryMeta, EXPENSE_CATEGORIES, naira, nairaWhole, shortDate } from './format';
import PeriodPicker from './period-picker';
import { isValidPeriod, periodFor, type Period } from './periods';

const PAGE_SIZE = 15;
type CategoryFilter = ExpenseCategory | 'ALL';

function CategoryChip({ category }: { category: ExpenseCategory }) {
  const meta = categoryMeta(category);
  return (
    <span className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: meta.color, backgroundColor: meta.bg }}>
      {meta.label}
    </span>
  );
}

function SummaryCard({ summary, active, onPick }: { summary: ExpenseSummary; active: CategoryFilter; onPick: (c: CategoryFilter) => void }) {
  const max = Math.max(1, ...summary.byCategory.map((c) => c.total));
  return (
    <div className="bg-white rounded-2xl shadow-card-md p-5">
      <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-[0.1em]">Spent in this period</p>
      <p className="mt-0.5 text-3xl font-bold text-[#091426] font-heading tabular-nums" title={naira(summary.total)}>
        {nairaWhole(summary.total)}
      </p>

      {summary.byCategory.length > 0 && (
        <ul className="mt-4 space-y-2">
          {[...summary.byCategory]
            .sort((a, b) => b.total - a.total)
            .map((c) => {
              const meta = categoryMeta(c.category);
              const selected = active === c.category;
              return (
                <li key={c.category}>
                  <button
                    type="button"
                    onClick={() => onPick(selected ? 'ALL' : c.category)}
                    aria-pressed={selected}
                    className={cn('w-full rounded-lg p-1.5 text-left transition-colors hover:bg-[#f8f9ff]', selected && 'bg-[#eff4ff]')}
                  >
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-[#334155]">{meta.label}</span>
                      <span className="shrink-0 tabular-nums text-[#091426]">{naira(c.total)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]" aria-hidden>
                      <div className="h-full rounded-full" style={{ width: `${Math.max((c.total / max) * 100, 2)}%`, backgroundColor: meta.color }} />
                    </div>
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

export default function ExpensesTab() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>(() => periodFor('this-month'));
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [page, setPage] = useState(0);
  // The dialogs keep their expense while they fade out, so their text does not blank mid-animation.
  const [form, setForm] = useState<{ open: boolean; expense: Expense | null }>({ open: false, expense: null });
  const [confirm, setConfirm] = useState<{ open: boolean; expense: Expense | null }>({ open: false, expense: null });
  const valid = isValidPeriod(period);

  // Any change to what is being looked at starts again from the first page.
  const changePeriod = (next: Period) => {
    setPeriod(next);
    setPage(0);
  };
  const changeCategory = (next: CategoryFilter) => {
    setCategory(next);
    setPage(0);
  };

  const list = useQuery({
    queryKey: ['finance', 'expenses', period.from, period.to, category, page],
    queryFn: () =>
      financeApi.listExpenses({
        from: period.from,
        to: period.to,
        category: category === 'ALL' ? undefined : category,
        page,
        size: PAGE_SIZE,
      }),
    enabled: valid,
    placeholderData: keepPreviousData,
  });

  const summary = useQuery({
    queryKey: ['finance', 'expense-summary', period.from, period.to],
    queryFn: () => financeApi.getExpenseSummary(period.from, period.to),
    enabled: valid,
  });

  const remove = useMutation({
    mutationFn: (id: number) => financeApi.deleteExpense(id),
    onSuccess: () => {
      toast.success('Expense deleted.');
      qc.invalidateQueries({ queryKey: ['finance'] });
      setConfirm((c) => ({ ...c, open: false }));
    },
    onError: (error) => toast.error(getApiError(error, 'Could not delete this expense.')),
  });

  const rows = list.data?.content ?? [];
  const filtered = category !== 'ALL';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PeriodPicker value={period} onChange={changePeriod} idPrefix="exp" />
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={(v) => changeCategory(String(v) as CategoryFilter)}>
            <SelectTrigger className="h-9 w-44" aria-label="Filter by category">
              <SelectValue>{category === 'ALL' ? 'All categories' : categoryMeta(category).label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="h-9 bg-[#091426] text-white hover:bg-[#091426]/90" onClick={() => setForm({ open: true, expense: null })}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add expense
          </Button>
        </div>
      </div>

      {valid && summary.data && <SummaryCard summary={summary.data} active={category} onPick={changeCategory} />}
      {valid && summary.isLoading && <Skeleton className="h-40 rounded-2xl" />}

      {!valid ? null : list.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : list.isError ? (
        <div className="bg-white rounded-2xl shadow-card-md p-8 text-center">
          <p className="text-sm text-[#64748b]">We couldn’t load your expenses.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => list.refetch()}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card-md">
          <EmptyState
            icon={Receipt}
            title={filtered ? 'No expenses in this category' : 'No expenses recorded yet'}
            subtitle="Record what you spend on stock, delivery, rent and the rest, and your profit and loss will account for it."
            action={{ label: 'Add an expense', onClick: () => setForm({ open: true, expense: null }) }}
          />
        </div>
      ) : (
        <div className={cn('bg-white rounded-2xl shadow-card-md', list.isPlaceholderData && 'opacity-70')} aria-busy={list.isPlaceholderData}>
          <ul className="divide-y divide-[rgba(9,20,38,0.06)]">
            {rows.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <CategoryChip category={e.category} />
                    <span className="text-xs text-[#64748b]">{shortDate(e.date)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-[#091426]">{e.vendor || e.note || categoryMeta(e.category).label}</p>
                  {e.vendor && e.note && <p className="truncate text-xs text-[#64748b]">{e.note}</p>}
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-[#091426]">{naira(e.amount)}</p>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit expense of ${naira(e.amount)} on ${shortDate(e.date)}`} onClick={() => setForm({ open: true, expense: e })}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    aria-label={`Delete expense of ${naira(e.amount)} on ${shortDate(e.date)}`}
                    onClick={() => setConfirm({ open: true, expense: e })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {list.data && (
            <div className="border-t border-[rgba(9,20,38,0.06)] p-3">
              <PaginationControls
                page={page}
                totalPages={list.data.totalPages}
                isFirst={list.data.first}
                isLast={list.data.last}
                onPrev={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() => setPage((p) => p + 1)}
              />
              <p className="mt-1 text-center text-xs text-[#64748b]">
                {list.data.totalElements} {list.data.totalElements === 1 ? 'expense' : 'expenses'}
              </p>
            </div>
          )}
        </div>
      )}

      <ExpenseDialog
        open={form.open}
        expense={form.expense}
        defaultCategory={category === 'ALL' ? 'STOCK_PURCHASE' : category}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
      />

      <Dialog open={confirm.open} onOpenChange={(open) => !open && setConfirm((c) => ({ ...c, open: false }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this expense?</DialogTitle>
            <DialogDescription>
              {confirm.expense
                ? `${naira(confirm.expense.amount)} on ${shortDate(confirm.expense.date)} (${categoryMeta(confirm.expense.category).label}) will be removed and your profit will go up by that amount.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm((c) => ({ ...c, open: false }))} disabled={remove.isPending}>
              Keep it
            </Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => confirm.expense && remove.mutate(confirm.expense.id)}>
              {remove.isPending ? 'Deleting…' : 'Delete expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
