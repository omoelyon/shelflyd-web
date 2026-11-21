'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { inventoryLedgerApi } from '@/lib/api/inventory-ledger';
import { cn, getApiError } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cleanAmountText, formatNaira, formatQty, formatSigned, parseAmount } from './format';

/** The product being changed, with what the dialog needs to explain the change. */
export interface AdjustTarget {
  productId: number;
  name: string;
  baseUnit: string;
  onHand: number;
  costPrice: number | null;
}

type Mode = 'RESTOCK' | 'ADJUSTMENT';

const CORRECTION_REASONS = ['Recount', 'Damaged', 'Expired', 'Lost or stolen', 'Used as samples', 'Other'] as const;

/** Rounds away floating-point noise from sums like 0.1 + 0.2. */
const tidy = (n: number) => Math.round(n * 10_000) / 10_000;

/**
 * Restock (stock arrived) or correct the count (it was wrong). Mount it only while it is open, so every opening starts
 * fresh. Quantities are in the product's own unit (kg, bag, piece...), as shown on the Stock tab.
 */
export default function AdjustStockDialog({ target, initialMode = 'RESTOCK', onClose }: { target: AdjustTarget; initialMode?: Mode; onClose: () => void }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [addedText, setAddedText] = useState('');
  const [countedText, setCountedText] = useState('');
  const [costText, setCostText] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [reasonChoice, setReasonChoice] = useState<(typeof CORRECTION_REASONS)[number]>('Recount');
  const [correctionNote, setCorrectionNote] = useState('');

  const added = parseAmount(addedText);
  const counted = parseAmount(countedText);
  const unitCost = parseAmount(costText);

  const change = mode === 'RESTOCK' ? (added ?? 0) : counted == null ? 0 : tidy(counted - target.onHand);
  const valid = mode === 'RESTOCK' ? added != null && added > 0 : counted != null && counted >= 0 && change !== 0;
  const newTotal = tidy(target.onHand + change);

  const mutation = useMutation({
    mutationFn: () => {
      const reason =
        mode === 'RESTOCK'
          ? restockNote.trim()
          : correctionNote.trim()
            ? `${reasonChoice}: ${correctionNote.trim()}`
            : reasonChoice;
      return inventoryLedgerApi.adjust(target.productId, {
        type: mode,
        change,
        ...(reason && { reason: reason.slice(0, 200) }),
        ...(mode === 'RESTOCK' && unitCost != null && unitCost >= 0 && { unitCost }),
      });
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['inventory-cover'] });
      qc.invalidateQueries({ queryKey: ['inventory-movements'] });
      qc.invalidateQueries({ queryKey: ['business-products'] });
      toast.success(`${target.name}: ${formatQty(result.onHand)} ${target.baseUnit} in stock now.`);
      onClose();
    },
    onError: (error) => toast.error(getApiError(error, 'We couldn’t change the stock. Try again.')),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change stock: {target.name}</DialogTitle>
          <DialogDescription>
            In stock now: <span className="font-medium text-[#091426]">{formatQty(target.onHand)} {target.baseUnit}</span>
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid && !mutation.isPending) mutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#f1f5f9] p-1" role="group" aria-label="What happened">
            {(
              [
                ['RESTOCK', 'More stock arrived'],
                ['ADJUSTMENT', 'Correct the count'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-200',
                  mode === value ? 'bg-white text-[#091426] shadow-sm' : 'text-[#64748b] hover:text-[#091426]',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'RESTOCK' ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="stock-added" className="text-sm font-medium text-[#091426]">
                  How many {target.baseUnit} arrived?
                </Label>
                <Input id="stock-added" inputMode="decimal" autoFocus autoComplete="off" placeholder="0" value={addedText} onChange={(e) => setAddedText(cleanAmountText(e.target.value, 4))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock-cost" className="text-sm font-medium text-[#091426]">
                  What did each {target.baseUnit} cost you? <span className="font-normal text-[#64748b]">(optional)</span>
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#64748b]" aria-hidden="true">₦</span>
                  <Input id="stock-cost" inputMode="decimal" autoComplete="off" className="pl-7" placeholder="0" value={costText} onChange={(e) => setCostText(cleanAmountText(e.target.value))} />
                </div>
                <p className="text-xs text-[#64748b]">
                  {target.costPrice != null ? `Your cost now is ${formatNaira(target.costPrice)} per ${target.baseUnit}. ` : ''}
                  Adding this keeps your average cost up to date, which your profit figures use.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock-note" className="text-sm font-medium text-[#091426]">
                  Note <span className="font-normal text-[#64748b]">(optional)</span>
                </Label>
                <Input id="stock-note" maxLength={160} autoComplete="off" placeholder="Supplier delivery, 14 Nov" value={restockNote} onChange={(e) => setRestockNote(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="stock-counted" className="text-sm font-medium text-[#091426]">
                  How many {target.baseUnit} are there really?
                </Label>
                <Input id="stock-counted" inputMode="decimal" autoFocus autoComplete="off" placeholder={formatQty(target.onHand)} value={countedText} onChange={(e) => setCountedText(cleanAmountText(e.target.value, 4))} />
                <p className="text-xs text-[#64748b]">Count what is on the shelf, then enter the total. We work out the difference.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#091426]">Why is it different?</Label>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reason">
                  {CORRECTION_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={reasonChoice === r}
                      onClick={() => setReasonChoice(r)}
                      className={cn(
                        'h-8 rounded-full border px-3 text-xs font-medium transition-colors',
                        reasonChoice === r ? 'border-[#091426] bg-[#091426] text-white' : 'border-[rgba(9,20,38,0.15)] bg-white text-[#475569] hover:bg-[#f8f9ff]',
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <Input aria-label="More detail" maxLength={150} autoComplete="off" placeholder="More detail (optional)" value={correctionNote} onChange={(e) => setCorrectionNote(e.target.value)} />
              </div>
            </>
          )}

          <p className="rounded-xl bg-[#f8f9ff] px-3 py-2 text-sm text-[#475569]" aria-live="polite">
            {valid ? (
              <>
                {formatSigned(change)} {target.baseUnit}: stock goes from <span className="font-semibold text-[#091426]">{formatQty(target.onHand)}</span> to{' '}
                <span className="font-semibold text-[#091426]">{formatQty(newTotal)}</span>.
              </>
            ) : mode === 'ADJUSTMENT' && counted != null && counted >= 0 && change === 0 ? (
              'That is the same as the stock we already show, so nothing changes.'
            ) : (
              'Enter the amount to see the new stock level.'
            )}
          </p>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-32 bg-[#0058be] text-white hover:bg-[#0058be]/90" disabled={!valid || mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : mode === 'RESTOCK' ? (
                'Add stock'
              ) : (
                'Save count'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
