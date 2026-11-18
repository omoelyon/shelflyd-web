'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiError } from '@/lib/utils';
import { suggestSet, useCartSetsActions } from '@/lib/cart-sets';
import type { CartGroup, CartProduct } from '@/types';
import QtyStepper from './qty-stepper';
import { toSetItems } from './set-card';

const naira = (n: number) => `₦${n.toLocaleString()}`;
const cents = (n: number) => Math.round(n * 100);

export type MakeSetTarget =
  /** Group ordinary cart lines into a new set. */
  | { mode: 'create'; lines: CartProduct[] }
  /** Change the quantities, number of sets or name of an existing set. */
  | { mode: 'edit'; group: CartGroup; lines: CartProduct[] };

interface MakeSetDialogProps {
  businessId: number;
  target: MakeSetTarget;
  onClose: () => void;
  /** Called after the set was saved. */
  onSaved: () => void;
}

/**
 * Design 1's dialog: turn the items ticked in the cart into a set. It opens pre-filled from the
 * quantities already in the cart (greatest common divisor), so the price does not change unless
 * the shopper changes something. Mount it only while it should be open.
 */
export default function MakeSetDialog({ businessId, target, onClose, onSaved }: MakeSetDialogProps) {
  const { createSet, updateSet } = useCartSetsActions(businessId);
  const editing = target.mode === 'edit';
  const lines = target.lines;

  const initial = useMemo(() => {
    if (target.mode === 'edit') {
      return { sets: target.group.sets, perSet: target.lines.map((l) => l.quantityPerSet ?? 1) };
    }
    return suggestSet(target.lines.map((l) => l.quantity));
  }, [target]);

  const [name, setName] = useState(target.mode === 'edit' ? target.group.name : '');
  const [sets, setSets] = useState(initial.sets);
  const [perSet, setPerSet] = useState<number[]>(initial.perSet);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const originalTotal = target.mode === 'edit' ? target.group.totalPrice : lines.reduce((s, l) => s + l.totalPrice, 0);
  const perSetPrice = lines.reduce((s, l, i) => s + l.unitPrice * perSet[i], 0);
  const total = perSetPrice * sets;
  const unchanged = cents(total) === cents(originalTotal);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const items = toSetItems(lines).map((item, i) => ({ ...item, quantityPerSet: perSet[i] }));
      if (target.mode === 'edit') {
        await updateSet(target.group.groupId, { name: name.trim() || undefined, sets, items });
        toast.success('Set updated.');
      } else {
        await createSet({ name: name.trim() || undefined, sets, items, absorbLoose: true });
        toast.success('Set added.');
      }
      onSaved();
    } catch (err) {
      setError(getApiError(err, 'Could not save the set. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit set' : 'Make a set'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Change what goes in one set, or how many sets you want.' : 'Choose what goes in one set, then how many sets you want.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="set-name">Name (optional)</Label>
          <Input id="set-name" value={name} maxLength={60} placeholder="e.g. Team lunch" onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">What goes in one set</p>
          <ul className="divide-y">
            {lines.map((l, i) => (
              <li key={`${l.productId}-${l.unitId}`} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{naira(l.unitPrice)} each</p>
                </div>
                <QtyStepper
                  value={perSet[i]}
                  onChange={(v) => setPerSet((prev) => prev.map((q, n) => (n === i ? v : q)))}
                  label={`${l.name} per set`}
                  max={1000}
                  className="shrink-0"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <span className="text-sm font-medium">How many sets?</span>
          <QtyStepper value={sets} onChange={setSets} label="sets" className="shrink-0" />
        </div>

        <div className="rounded-lg bg-muted/60 p-3 text-sm" aria-live="polite">
          <p>
            {sets} {sets === 1 ? 'set' : 'sets'} of {lines.map((l, i) => `${perSet[i]} × ${l.name}`).join(' + ')}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {naira(perSetPrice)} per set × {sets} = <span className="font-semibold text-foreground">{naira(total)}</span>
          </p>
          <p className={`mt-1.5 text-xs ${unchanged ? 'text-green-700' : 'text-amber-700'}`}>
            {unchanged
              ? editing
                ? 'The price stays the same.'
                : 'Same items and price as before. They’re just grouped.'
              : `This changes the price from ${naira(originalTotal)} to ${naira(total)}.`}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" className="bg-primary text-primary-foreground hover:opacity-90" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Save set'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
