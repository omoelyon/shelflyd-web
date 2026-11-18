import { Fragment, type ReactNode } from 'react';
import { Layers, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { packingList, splitCart, splitOrderItems } from '@/lib/cart-sets';
import type { CartResponse, OrderItem } from '@/types';

const qty = (n: number | null | undefined) => String(Number(n ?? 0));
const naira = (n: number) => `₦${Number(n).toLocaleString()}`;

type Tone = 'customer' | 'seller';

interface SetSummaryCardProps {
  name: string;
  sets: number;
  contents: string[];
  perSetPrice: number;
  total: number;
  tone?: Tone;
}

/** One set, read-only: its name, how many sets, what each holds, and the maths. */
export function SetSummaryCard({ name, sets, contents, perSetPrice, total, tone = 'customer' }: SetSummaryCardProps) {
  const seller = tone === 'seller';
  return (
    <div className={cn('rounded-lg border p-3 min-w-0', seller ? 'border-[#e2e8f0] bg-[#f8f9ff]' : 'bg-muted/30')}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn('flex items-center gap-1.5 min-w-0 text-sm font-medium', seller && 'text-[#091426]')}>
          <Layers className={cn('h-4 w-4 shrink-0', seller ? 'text-[#0058be]' : 'text-primary')} aria-hidden="true" />
          <span className="truncate">{name}</span>
        </p>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
            seller ? 'bg-[#eff4ff] text-[#0058be]' : 'bg-primary/10 text-primary',
          )}
        >
          {sets} {sets === 1 ? 'set' : 'sets'}
        </span>
      </div>
      <p className={cn('mt-1 text-xs break-words', seller ? 'text-[#64748b]' : 'text-muted-foreground')}>
        Each set: {contents.join(' + ')}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={cn('text-xs tabular-nums', seller ? 'text-[#64748b]' : 'text-muted-foreground')}>
          {naira(perSetPrice)} per set × {sets}
        </span>
        <span className={cn('text-sm font-semibold tabular-nums', seller ? 'text-[#091426]' : 'text-primary')}>
          {naira(total)}
        </span>
      </div>
    </div>
  );
}

/**
 * Checkout's order summary lines: sets first, then ordinary lines exactly as checkout always showed them.
 * Renders a fragment so it slots into the page's own `space-y-2` container.
 */
export function CartLinesSummary({ cart }: { cart: CartResponse }) {
  const { sets, loose } = splitCart(cart);
  return (
    <>
      {sets.map((s) => (
        <SetSummaryCard
          key={`set-${s.group.groupId}`}
          name={s.group.name}
          sets={s.group.sets}
          contents={s.lines.map((l) => `${qty(l.quantityPerSet)} × ${l.name}`)}
          perSetPrice={s.perSetPrice}
          total={s.group.totalPrice || s.lines.reduce((sum, l) => sum + l.totalPrice, 0)}
        />
      ))}
      {loose.map((p, i) => (
        <div key={`${p.productId}-${p.unitId}-${i}`} className="flex justify-between text-sm">
          <span>
            {p.name} × {p.quantity}
          </span>
          <span className="font-medium">{naira(p.totalPrice)}</span>
        </div>
      ))}
    </>
  );
}

interface OrderItemsListProps {
  items: OrderItem[];
  /** Renders one ordinary line in the host page's own style. Don't set a key; the list adds it. */
  renderItem: (item: OrderItem) => ReactNode;
  tone?: Tone;
}

/**
 * An order's items: sets first (read-only cards), then ordinary lines through `renderItem`.
 * Renders a fragment, so with no sets the host page looks exactly as before.
 */
export function OrderItemsList({ items, renderItem, tone = 'customer' }: OrderItemsListProps) {
  const { sets, loose } = splitOrderItems(items);
  const wrap = (card: ReactNode) => (tone === 'seller' ? <div className="px-5 py-3">{card}</div> : card);
  return (
    <>
      {sets.map((s) => (
        <Fragment key={`set-${s.groupId}`}>
          {wrap(
            <SetSummaryCard
              name={s.name}
              sets={s.sets}
              contents={s.lines.map((l) => `${qty(l.quantityPerSet)} × ${l.name}`)}
              perSetPrice={s.perSetPrice}
              total={s.total}
              tone={tone}
            />,
          )}
        </Fragment>
      ))}
      {loose.map((item, i) => (
        <Fragment key={`${item.productId}-${i}`}>{renderItem(item)}</Fragment>
      ))}
    </>
  );
}

/** Seller's "To prepare" checklist: every product totalled across sets and ordinary lines. Only shown for orders with sets. */
export function PackingList({ items }: { items: OrderItem[] }) {
  if (!items.some((i) => i.groupId != null)) return null;
  const list = packingList(items);
  return (
    <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#f1f5f9]">
        <ClipboardList className="h-4 w-4 text-[#64748b]" aria-hidden="true" />
        <h2 className="font-semibold text-sm text-[#091426] font-heading">To prepare</h2>
      </div>
      <ul className="divide-y divide-[#f1f5f9]">
        {list.map((p) => (
          <li key={`${p.name}-${p.unit}`} className="flex items-center gap-3 px-5 py-2.5 text-sm">
            <span className="h-4 w-4 shrink-0 rounded border border-[#cbd5e1]" aria-hidden="true" />
            <span className="font-semibold tabular-nums text-[#091426]">{qty(p.quantity)}×</span>
            <span className="min-w-0 flex-1 truncate text-[#091426]">{p.name}</span>
            {p.unit && <span className="shrink-0 text-xs text-[#64748b]">{p.unit}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
