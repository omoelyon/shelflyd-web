'use client';

import { useState } from 'react';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getApiError } from '@/lib/utils';
import { useCartSetsActions, type SetItemInput, type SetView } from '@/lib/cart-sets';
import { maxSetsInStock } from '@/lib/cart-stock';
import type { CartProduct } from '@/types';
import QtyStepper from './qty-stepper';

const naira = (n: number) => `₦${n.toLocaleString()}`;

/** The items of a set in the shape the set actions take (also what the guest cart stores). */
export function toSetItems(lines: CartProduct[]): SetItemInput[] {
  return lines.map((l) => ({
    productId: l.productId,
    unitId: l.unitId,
    quantityPerSet: l.quantityPerSet ?? 1,
    note: l.note,
    name: l.name,
    type: l.type,
    image: l.image,
    unit: l.unit,
    unitPrice: l.unitPrice,
  }));
}

interface SetCardProps {
  businessId: number;
  set: SetView;
  onEdit: (set: SetView) => void;
}

/** One set in the cart: what is in a single set, how many sets, and the actions to change or undo it. */
export default function SetCard({ businessId, set, onEdit }: SetCardProps) {
  const { group, lines, perSetPrice } = set;
  const { updateSet, removeSet } = useCartSetsActions(businessId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  // The most sets the stock allows; the stepper stops there instead of letting the server refuse.
  const stockMax = maxSetsInStock(lines);

  const run = async (action: () => Promise<void>, fallback: string, success?: string) => {
    setBusy(true);
    setError('');
    try {
      await action();
      if (success) toast.success(success);
    } catch (err) {
      const message = getApiError(err, fallback);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const changeSets = (sets: number) =>
    run(() => updateSet(group.groupId, { name: group.name, sets, items: toSetItems(lines) }), 'Could not update the number of sets.');

  return (
    <section aria-label={`${group.name}, ${group.sets} ${group.sets === 1 ? 'set' : 'sets'}`} className="sf-rise rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
          <Layers className="h-4 w-4 shrink-0 text-[#0058be]" aria-hidden="true" />
          <span className="truncate">{group.name}</span>
        </h3>
        <QtyStepper value={group.sets} onChange={changeSets} label="sets" disabled={busy} max={Math.max(group.sets, stockMax ?? 1000)} className="shrink-0" />
      </div>

      <p className="mt-0.5 text-xs text-muted-foreground">
        {group.sets} {group.sets === 1 ? 'set' : 'sets'}, each containing:
      </p>
      <ul className="mt-1.5 space-y-1">
        {lines.map((l) => (
          <li key={`${l.productId}-${l.unitId}`} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {l.quantityPerSet ?? 1} × {l.name}
              {l.unit ? <span className="text-xs text-muted-foreground"> ({l.unit})</span> : null}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {naira(l.unitPrice * (l.quantityPerSet ?? 1))}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between gap-3 border-t pt-2">
        <span className="text-xs text-muted-foreground">
          {naira(perSetPrice)} per set × {group.sets}
        </span>
        <span className="text-sm font-semibold text-primary tabular-nums">{naira(group.totalPrice)}</span>
      </div>

      {stockMax != null && group.sets > stockMax && (
        <p role="alert" className="mt-2 text-xs font-medium text-destructive">
          {stockMax === 0 ? 'Not enough stock left for even one set. Remove it to continue.' : `Only enough stock for ${stockMax} ${stockMax === 1 ? 'set' : 'sets'}. Reduce the number of sets to continue.`}
        </p>
      )}
      {stockMax != null && group.sets <= stockMax && stockMax - group.sets < 3 && (
        <p className="mt-2 text-xs text-amber-700">
          {stockMax === group.sets ? `That's all the stock for ${group.sets} ${group.sets === 1 ? 'set' : 'sets'}.` : `Stock allows up to ${stockMax} sets.`}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {confirmRemove ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Remove this set from your cart?</span>
          <Button
            type="button"
            size="xs"
            variant="destructive"
            disabled={busy}
            onClick={() => run(() => removeSet(group.groupId, 'remove'), 'Could not remove the set.', 'Set removed.')}
          >
            Remove
          </Button>
          <Button type="button" size="xs" variant="ghost" onClick={() => setConfirmRemove(false)}>
            Keep it
          </Button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <button type="button" className="text-xs font-medium text-[#0058be] hover:underline disabled:opacity-50" disabled={busy} onClick={() => onEdit(set)}>
            Edit set
          </button>
          <button
            type="button"
            className="text-xs font-medium text-[#0058be] hover:underline disabled:opacity-50"
            disabled={busy}
            onClick={() => run(() => removeSet(group.groupId, 'ungroup'), 'Could not ungroup the set.', 'Set ungrouped. Items are back in your cart.')}
          >
            Ungroup
          </button>
          <button
            type="button"
            className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
            disabled={busy}
            onClick={() => setConfirmRemove(true)}
          >
            Remove set
          </button>
        </div>
      )}
    </section>
  );
}
