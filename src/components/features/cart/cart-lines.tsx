'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import Image from 'next/image';
import { Layers, Minus, Plus, Trash2, X } from 'lucide-react';
import { atStockLimit, lineStock } from '@/lib/cart-stock';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { splitCart, useSetsVariant, type SetView } from '@/lib/cart-sets';
import { BuildSetButton, SetBuilderDialog } from '@/components/features/cart-sets/set-builder-dialog';
import type { CartProduct, CartResponse } from '@/types';
import MakeSetDialog from './make-set-dialog';
import SetCard from './set-card';

const HINT_KEY = 'mm-sets-hint-dismissed';
const HINT_EVENT = 'mm-sets-hint-change';
const lineKey = (p: Pick<CartProduct, 'productId' | 'unitId'>) => `${p.productId}:${p.unitId}`;

function subscribeHint(onChange: () => void) {
  window.addEventListener(HINT_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(HINT_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function hintDismissedSnapshot() {
  try {
    return localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
}

/** Whether the shopper has closed the "group items" tip (per browser). The server render counts it as closed so it never flashes in. */
function useHintDismissed() {
  return useSyncExternalStore(subscribeHint, hintDismissedSnapshot, () => true);
}

interface CartLinesProps {
  cart: CartResponse;
  businessName?: string;
  isAuthenticated: boolean;
  onIncrement: (product: CartProduct) => void;
  onDecrement: (product: CartProduct) => void;
  onRemove: (product: CartProduct) => void;
  incrementPending?: boolean;
  decrementPending?: boolean;
  removePending?: boolean;
}

type DialogState = { mode: 'create'; lines: CartProduct[] } | { mode: 'edit'; set: SetView } | null;

/**
 * Everything inside one store's cart card: its sets, then the ordinary lines. Shared by the
 * multi-store cart page and the storefront cart page. With no sets and no set action taken it
 * renders exactly the plain line list the cart always had.
 */
export default function CartLines({
  cart,
  businessName,
  isAuthenticated,
  onIncrement,
  onDecrement,
  onRemove,
  incrementPending,
  decrementPending,
  removePending,
}: CartLinesProps) {
  const { design1, design2 } = useSetsVariant();
  const { sets, loose } = splitCart(cart);

  const hintDismissed = useHintDismissed();
  const [selectingRaw, setSelecting] = useState(false);
  // Switching Design 1 off (QA badge) while selecting simply ends selection mode.
  const selecting = design1 && selectingRaw;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectError, setSelectError] = useState('');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [builderEditing, setBuilderEditing] = useState<SetView | null>(null);

  // Removing a line: it fades and slides out first, then the removal is sent. If the removal fails the line comes back.
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);
  const removeWithExit = (product: CartProduct) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onRemove(product);
      return;
    }
    const key = lineKey(product);
    setLeaving((prev) => new Set(prev).add(key));
    timers.current.push(window.setTimeout(() => onRemove(product), 200));
    timers.current.push(
      window.setTimeout(() => {
        setLeaving((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 3500),
    );
  };

  const dismissHint = () => {
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch {
      // storage blocked: the hint just comes back next visit
    }
    window.dispatchEvent(new Event(HINT_EVENT));
  };

  const startSelecting = () => {
    setSelecting(true);
    setSelected(new Set());
    setSelectError('');
  };

  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
    setSelectError('');
  };

  const toggle = (product: CartProduct) => {
    setSelectError('');
    setSelected((prev) => {
      const next = new Set(prev);
      const key = lineKey(product);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const makeSet = () => {
    const chosen = loose.filter((p) => selected.has(lineKey(p)));
    if (chosen.length < 2) {
      setSelectError('Pick at least 2 items to make a set.');
      return;
    }
    setDialog({ mode: 'create', lines: chosen });
  };

  const editSet = (set: SetView) => {
    if (design2) setBuilderEditing(set);
    else setDialog({ mode: 'edit', set });
  };

  const showHint = design1 && !selecting && loose.length >= 2;

  return (
    <div className="space-y-3">
      {design2 && (
        <div className="flex justify-end">
          <BuildSetButton businessId={cart.businessId} businessName={businessName} appearance="outline" label="Add a set" />
        </div>
      )}

      {showHint &&
        (hintDismissed ? (
          <button
            type="button"
            onClick={startSelecting}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0058be] hover:underline"
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            Group items into sets
          </button>
        ) : (
          <div className="flex items-start gap-2 rounded-lg bg-[#eff4ff] p-2.5">
            <Layers className="mt-0.5 h-4 w-4 shrink-0 text-[#0058be]" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-xs text-[#0b2a5b]">Ordering the same combo for several people? Group items into sets.</p>
            <Button type="button" size="xs" variant="ghost" className="shrink-0 text-[#0058be] hover:bg-white/60" onClick={startSelecting}>
              Group items
            </Button>
            <button
              type="button"
              onClick={dismissHint}
              aria-label="Dismiss this tip"
              className="-mr-1 shrink-0 rounded p-1 text-[#0b2a5b]/60 hover:text-[#0b2a5b]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

      {selecting && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-[#eff4ff] p-2.5">
          <p className="min-w-0 text-xs text-[#0b2a5b]">Tick the items that go together in one set</p>
          <Button type="button" size="xs" variant="ghost" className="shrink-0 text-[#0058be] hover:bg-white/60" onClick={stopSelecting}>
            Cancel
          </Button>
        </div>
      )}

      {sets.map((set) => (
        <SetCard key={set.group.groupId} businessId={cart.businessId} set={set} onEdit={editSet} />
      ))}

      {sets.length > 0 && loose.length > 0 && <p className="pt-1 text-xs font-medium text-muted-foreground">Other items</p>}

      {loose.map((product, index) => {
        const ticked = selected.has(lineKey(product));
        const Row = selecting ? 'label' : 'div';
        const exiting = leaving.has(lineKey(product));
        return (
          <Row
            key={lineKey(product)}
            className={cn(
              'flex items-center gap-4 rounded-lg bg-muted/40 p-3 transition-shadow duration-200',
              // New lines rise in; a line being removed fades and slides away (the animation class is dropped so the exit can run).
              exiting
                ? 'pointer-events-none -translate-x-3 opacity-0 transition-[opacity,translate] duration-200 ease-in'
                : 'sf-rise',
              selecting && 'cursor-pointer',
              selecting && ticked && 'ring-2 ring-[#0058be]/50',
            )}
            style={{ '--sf-i': index } as CSSProperties}
          >
            {selecting && (
              <input
                type="checkbox"
                checked={ticked}
                onChange={() => toggle(product)}
                aria-label={`Select ${product.name}`}
                className="h-4 w-4 shrink-0 accent-[#0058be]"
              />
            )}
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {product.image ? (
                <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 bg-muted" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.unit} · {product.quantity}x · ₦{product.unitPrice.toLocaleString()} each
              </p>
              {product.note && <p className="mt-0.5 text-xs italic text-muted-foreground">Note: {product.note}</p>}
              <StockNote line={product} />
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold text-primary">₦{product.totalPrice.toLocaleString()}</p>
              {!selecting && (
                <div className="mt-1.5 flex items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    aria-label={`Decrease ${product.name}`}
                    onClick={() => onDecrement(product)}
                    disabled={isAuthenticated && decrementPending}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium tabular-nums">{product.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    aria-label={`Increase ${product.name}`}
                    onClick={() => onIncrement(product)}
                    disabled={(isAuthenticated && incrementPending) || atStockLimit(product)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 text-destructive hover:text-destructive"
                    aria-label={`Remove ${product.name}`}
                    onClick={() => removeWithExit(product)}
                    disabled={removePending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </Row>
        );
      })}

      {selecting && (
        <div>
          <Button type="button" variant="outline" className="w-full" onClick={makeSet}>
            Make a set ({selected.size})
          </Button>
          {selectError && (
            <p role="alert" className="mt-1.5 text-xs text-destructive">
              {selectError}
            </p>
          )}
        </div>
      )}

      {dialog && (
        <MakeSetDialog
          businessId={cart.businessId}
          target={
            dialog.mode === 'create'
              ? { mode: 'create', lines: dialog.lines }
              : { mode: 'edit', group: dialog.set.group, lines: dialog.set.lines }
          }
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            stopSelecting();
          }}
        />
      )}

      {design2 && (
        <SetBuilderDialog
          businessId={cart.businessId}
          businessName={businessName}
          open={builderEditing !== null}
          onOpenChange={(open) => !open && setBuilderEditing(null)}
          editing={builderEditing ? { group: builderEditing.group, lines: builderEditing.lines } : null}
        />
      )}
    </div>
  );
}

/** "Only 3 left" / "Sold out" under a cart line, so the limit is visible before checkout refuses. */
function StockNote({ line }: { line: CartProduct }) {
  const stock = lineStock(line);
  if (stock.kind === 'ok') return null;
  const text =
    stock.kind === 'soldout'
      ? 'Sold out. Remove it to continue.'
      : stock.kind === 'short'
        ? `Only ${stock.left} left. Reduce the quantity to continue.`
        : `Only ${stock.left} left`;
  return (
    <p role={stock.kind === 'low' ? undefined : 'alert'} className={stock.kind === 'low' ? 'mt-0.5 text-xs text-amber-700' : 'mt-0.5 text-xs font-medium text-destructive'}>
      {text}
    </p>
  );
}
