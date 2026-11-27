'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { getApiError } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UpdateProductRequest } from '@/types';
import type { WithCostPrice } from '@/types/inventory';
import { cleanAmountText, formatNaira, parseAmount } from './format';

export interface CostTarget {
  productId: number;
  name: string;
  baseUnit: string;
  costPrice: number | null;
}

/** Enter what a product costs the seller, right where the missing cost was pointed out. Profit and stock value use it. */
export default function SetCostDialog({ target, onClose }: { target: CostTarget; onClose: () => void }) {
  const qc = useQueryClient();
  const [text, setText] = useState(target.costPrice != null ? String(target.costPrice) : '');
  const amount = parseAmount(text);

  const save = useMutation({
    mutationFn: () => productsApi.update(target.productId, { costPrice: amount } as WithCostPrice<UpdateProductRequest>),
    onSuccess: () => {
      toast.success(`Cost price saved for ${target.name}.`);
      // Stock value, profit, margins and the product list all read it.
      qc.invalidateQueries();
      onClose();
    },
    onError: (error) => toast.error(getApiError(error, 'Could not save the cost price.')),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cost price: {target.name}</DialogTitle>
          <DialogDescription>What one {target.baseUnit} costs you to buy or make. Only you see it.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (amount != null && !save.isPending) save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="cost-price" className="text-sm font-medium text-[#091426]">
              Cost per {target.baseUnit}
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#64748b]" aria-hidden="true">₦</span>
              <Input id="cost-price" inputMode="decimal" autoFocus autoComplete="off" className="pl-7" placeholder="0" value={text} onChange={(e) => setText(cleanAmountText(e.target.value))} />
            </div>
            {target.costPrice != null && <p className="text-xs text-[#64748b]">Currently {formatNaira(target.costPrice)}.</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={amount == null || save.isPending} className="bg-[#091426] text-white hover:bg-[#091426]/90">
              {save.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
