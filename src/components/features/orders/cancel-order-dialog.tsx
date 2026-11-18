'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ordersApi } from '@/lib/api/orders';
import { getApiError } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MAX_REASON = 255;

/** Seller: cancel an order that hasn't been dispatched. The buyer is refunded in full and the items go back to stock. */
export default function CancelOrderDialog({
  orderId,
  courierBooked,
  open,
  onOpenChange,
}: {
  orderId: number;
  /** A courier shipment exists for this order. */
  courierBooked: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(orderId, reason),
    onSuccess: () => {
      toast.success('Order cancelled. The buyer is being refunded.');
      qc.invalidateQueries({ queryKey: ['order-detail', orderId] });
      qc.invalidateQueries({ queryKey: ['order-items', orderId] });
      qc.invalidateQueries({ queryKey: ['business-orders'] });
      qc.invalidateQueries({ queryKey: ['business-stats'] });
      qc.invalidateQueries({ queryKey: ['earnings-summary'] });
      qc.invalidateQueries({ queryKey: ['earnings-transactions'] });
      onOpenChange(false);
      setReason('');
    },
    onError: (error) => toast.error(getApiError(error, 'Could not cancel this order.')),
  });

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!cancelMutation.isPending) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel this order?</DialogTitle>
          <DialogDescription>
            The buyer is refunded in full, the items go back into your stock, and this order no longer counts towards
            your earnings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <label htmlFor="cancel-reason" className="text-sm font-medium text-[#091426]">
            Reason (the buyer will see it)
          </label>
          <Textarea
            id="cancel-reason"
            value={reason}
            maxLength={MAX_REASON}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Sold out of an ingredient"
            rows={3}
          />
          <p className="text-xs text-[#64748b] text-right tabular-nums">{reason.length}/{MAX_REASON}</p>
        </div>

        {courierBooked && (
          <p className="text-xs text-[#64748b]">
            If a courier delivery is already booked, also cancel it in your Shipbubble account.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancelMutation.isPending}>
            Keep order
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Cancelling…' : 'Cancel order and refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
