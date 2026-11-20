'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MOCK_CART } from './mock-cart';

const naira = (n: number) => `₦${n.toLocaleString()}`;

/** The sample lines of the preview cart: same look as the real cart lines, but static. */
export function MockCartLines() {
  return (
    <div className="space-y-3">
      {MOCK_CART.products.map((p) => (
        <div key={p.productId} className="flex items-center gap-4 rounded-lg bg-muted/40 p-3">
          <div className="h-16 w-16 shrink-0 rounded-lg bg-muted" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground">
              {p.unit} · {p.quantity}x · {naira(p.unitPrice)} each
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold text-primary">{naira(p.totalPrice)}</p>
            <div className="mt-1.5 flex items-center justify-end gap-1" aria-hidden="true">
              <Button variant="outline" size="icon" className="h-6 w-6" tabIndex={-1}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center text-sm font-medium tabular-nums">{p.quantity}</span>
              <Button variant="outline" size="icon" className="h-6 w-6" tabIndex={-1}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MockCartTotal() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Total</p>
        <p className="text-xl font-bold text-primary">{naira(MOCK_CART.totalCost)}</p>
      </div>
      <Button className="bg-primary text-primary-foreground hover:opacity-90" tabIndex={-1} aria-disabled="true">
        Checkout
      </Button>
    </div>
  );
}
