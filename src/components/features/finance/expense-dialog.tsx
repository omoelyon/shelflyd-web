'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { financeApi } from '@/lib/api/finance';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getApiError } from '@/lib/utils';
import type { Expense, ExpenseCategory, ExpenseInput } from '@/types/finance';
import { categoryMeta, EXPENSE_CATEGORIES } from './format';
import { todayYmd } from './periods';

const MAX_AMOUNT = 999_999_999.99;

/** Digits with at most one dot and two decimals, so the box can never hold something that is not a naira amount. */
function cleanAmount(raw: string): string {
  const stripped = raw.replace(/[^\d.]/g, '');
  const [whole, ...rest] = stripped.split('.');
  return rest.length === 0 ? whole : `${whole}.${rest.join('').slice(0, 2)}`;
}

interface FormProps {
  expense: Expense | null;
  defaultCategory: ExpenseCategory;
  onClose: () => void;
}

function ExpenseForm({ expense, defaultCategory, onClose }: FormProps) {
  const qc = useQueryClient();
  const [date, setDate] = useState(expense?.date ?? todayYmd());
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? defaultCategory);
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [vendor, setVendor] = useState(expense?.vendor ?? '');
  const [note, setNote] = useState(expense?.note ?? '');
  const [touched, setTouched] = useState(false);

  const amountNumber = Number(amount);
  const errors = {
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? '' : 'Choose a date.',
    amount: !amount || !Number.isFinite(amountNumber) || amountNumber <= 0 ? 'Enter an amount above zero.' : amountNumber > MAX_AMOUNT ? 'That amount is too large.' : '',
  };
  const hasErrors = Boolean(errors.date || errors.amount);

  const save = useMutation({
    mutationFn: (input: ExpenseInput) => (expense ? financeApi.updateExpense(expense.id, input) : financeApi.createExpense(input)),
    onSuccess: () => {
      toast.success(expense ? 'Expense updated.' : 'Expense added.');
      qc.invalidateQueries({ queryKey: ['finance'] });
      onClose();
    },
    onError: (error) => toast.error(getApiError(error, 'Could not save this expense.')),
  });

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (hasErrors) return;
        save.mutate({
          date,
          category,
          amount: Math.round(amountNumber * 100) / 100,
          vendor: vendor.trim() || null,
          note: note.trim() || null,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="expense-amount">Amount (₦)</Label>
          <Input
            id="expense-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            aria-invalid={touched && !!errors.amount}
            onChange={(e) => setAmount(cleanAmount(e.target.value))}
            autoFocus
          />
          {touched && errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expense-date">Date</Label>
          <Input id="expense-date" type="date" value={date} aria-invalid={touched && !!errors.date} onChange={(e) => setDate(e.target.value)} />
          {touched && errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="expense-category">Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(String(v) as ExpenseCategory)}>
          <SelectTrigger id="expense-category" className="w-full">
            <SelectValue>{categoryMeta(category).label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{categoryMeta(category).hint}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="expense-vendor">Paid to (optional)</Label>
        <Input id="expense-vendor" maxLength={120} placeholder="Supplier, landlord, rider…" value={vendor} onChange={(e) => setVendor(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="expense-note">Note (optional)</Label>
        <Textarea id="expense-note" maxLength={300} rows={2} placeholder="What it was for, an invoice number…" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#091426] text-white hover:bg-[#091426]/90" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : expense ? 'Save changes' : 'Add expense'}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface ExpenseDialogProps {
  open: boolean;
  /** The expense being edited, or null to add a new one. */
  expense: Expense | null;
  defaultCategory?: ExpenseCategory;
  onClose: () => void;
}

/** Add or edit one expense. The form is created fresh each time the dialog opens, so it never shows the previous entry. */
export default function ExpenseDialog({ open, expense, defaultCategory = 'STOCK_PURCHASE', onClose }: ExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit expense' : 'Add an expense'}</DialogTitle>
          <DialogDescription>Money you spent running the business. It comes off your profit.</DialogDescription>
        </DialogHeader>
        <ExpenseForm key={expense?.id ?? 'new'} expense={expense} defaultCategory={defaultCategory} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
