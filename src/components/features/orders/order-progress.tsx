import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { displayOrderStatus } from '@/lib/order-status';
import { cn } from '@/lib/utils';
import type { Order } from '@/types';

/** The steps an order passes through, and how far along it is (index of the step it is on). */
function progressOf(order: Pick<Order, 'status' | 'orderType' | 'readyForPickupAt'>): { steps: string[]; current: number } {
  if (order.orderType === 'PICKUP') {
    const current = order.status === 'COMPLETED' ? 2 : order.readyForPickupAt ? 1 : 0;
    return { steps: ['Processing', 'Ready for pickup', 'Completed'], current };
  }
  const current = order.status === 'COMPLETED' ? 2 : order.status === 'DISPATCHED' ? 1 : 0;
  return { steps: ['Processing', 'Dispatched', 'Completed'], current };
}

/**
 * Where the buyer's order is, as three steps: pickup orders go Processing, Ready for pickup, Completed;
 * delivery orders go Processing, Dispatched, Completed. Shows nothing for a cancelled order, which has its own card.
 */
export default function OrderProgress({ order }: { order: Order }) {
  if (order.status === 'CANCELLED') return null;
  const { steps, current } = progressOf(order);
  const finished = order.status === 'COMPLETED';
  const status = displayOrderStatus(order, 'buyer');

  return (
    <Card>
      <CardContent className="py-5 space-y-4">
        <ol className="flex items-start" aria-label="Order progress">
          {steps.map((label, i) => {
            const done = i < current || finished;
            const active = i === current && !finished;
            return (
              <li key={label} className="flex-1 min-w-0 flex flex-col items-center text-center relative" aria-current={active ? 'step' : undefined}>
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className={cn('absolute top-3.5 right-1/2 h-0.5 w-full -translate-y-1/2', i <= current || finished ? 'bg-[#0058be]' : 'bg-border')}
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold',
                    done && 'bg-[#0058be] text-white',
                    active && 'bg-white text-[#0058be] ring-2 ring-[#0058be]',
                    !done && !active && 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                </span>
                <span className={cn('mt-2 px-1 text-xs leading-tight', done || active ? 'font-medium text-[#091426]' : 'text-muted-foreground')}>
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-muted-foreground text-center">{status.detail}</p>
      </CardContent>
    </Card>
  );
}
