'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { BellRing, CheckCircle2, ExternalLink, Truck, XCircle } from 'lucide-react';
import { ordersApi } from '@/lib/api/orders';
import { getApiError } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import CancelOrderDialog from './cancel-order-dialog';
import { useMyAccess } from '@/hooks/use-my-access';
import type { Order, OrderStatus, Shipment } from '@/types';

const parseDate = (value: string) => new Date(value.includes('T') ? value : value.replace(' ', 'T'));

/**
 * What the seller can do with an order right now, following the server's rules:
 * pickup orders are marked ready and then handed over with the buyer's code; a delivery the seller makes
 * themselves goes Dispatched then Completed; a courier delivery updates by itself; Cancel is open while PROCESSING.
 */
export default function SellerOrderActions({
  order,
  shipment,
  shipmentLoading,
}: {
  order: Order;
  shipment: Shipment | null | undefined;
  shipmentLoading: boolean;
}) {
  const qc = useQueryClient();
  const [confirmingReady, setConfirmingReady] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const { access, can } = useMyAccess();

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['order-detail', order.id] });
    qc.invalidateQueries({ queryKey: ['business-orders'] });
    qc.invalidateQueries({ queryKey: ['business-stats'] });
  };

  const readyMutation = useMutation({
    mutationFn: () => ordersApi.markReadyForPickup(order.id),
    onSuccess: () => {
      toast.success('The buyer has been told their order is ready.');
      setConfirmingReady(false);
      refresh();
    },
    onError: (error) => toast.error(getApiError(error, 'Could not mark this order ready.')),
  });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateStatus(order.id, status),
    onSuccess: () => {
      toast.success('Order status updated!');
      refresh();
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to update status.')),
  });

  if (order.status === 'CANCELLED') {
    return (
      <div role="status" className="rounded-xl bg-red-50 p-4 text-sm text-red-900 space-y-1">
        <p className="font-semibold flex items-center gap-1.5">
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Order cancelled{order.cancelledAt ? ` · ${format(parseDate(order.cancelledAt), 'dd MMM yyyy, HH:mm')}` : ''}
        </p>
        {order.cancelReason && <p>Reason: {order.cancelReason}</p>}
        <p className="text-xs text-red-800">The buyer was refunded and the items went back into your stock.</p>
      </div>
    );
  }
  if (order.status === 'COMPLETED') return null;

  const pickup = order.orderType === 'PICKUP';
  const courier = !!shipment || !!(order as Order & { courierRequestToken?: string | null }).courierRequestToken;
  const processing = order.status === 'PROCESSING';
  // Cancelling refunds the buyer, so it needs its own permission (owner, or a role with "Cancel and refund orders").
  const canCancel = !access || can('ORDERS_CANCEL');
  const busy = readyMutation.isPending || statusMutation.isPending;

  return (
    <div className="space-y-3">
      {pickup && processing && (
        order.readyForPickupAt ? (
          <p className="flex items-center gap-1.5 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Buyer notified · {format(parseDate(order.readyForPickupAt), 'dd MMM, HH:mm')}
          </p>
        ) : confirmingReady ? (
          <div className="rounded-xl bg-[#f8f9ff] p-3 space-y-2">
            <p className="text-xs text-[#64748b]">
              The buyer is emailed their pickup pass and told the order is ready to collect.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => readyMutation.mutate()} disabled={busy}>
                {readyMutation.isPending ? 'Sending…' : 'Yes, notify the buyer'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmingReady(false)} disabled={busy}>
                Back
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" onClick={() => setConfirmingReady(true)}>
            <BellRing className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Mark ready for pickup
          </Button>
        )
      )}

      {!pickup && courier && (
        <div className="flex items-start gap-2 text-xs text-[#64748b]">
          <Truck className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            This delivery is tracked by the courier and updates by itself.
            {shipment?.trackingUrl && (
              <>
                {' '}
                <a
                  href={shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#0058be] hover:underline"
                >
                  Track package <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </>
            )}
          </p>
        </div>
      )}

      {!pickup && !courier && !shipmentLoading && (
        <>
          {processing && (
            <Button size="sm" onClick={() => statusMutation.mutate('DISPATCHED')} disabled={busy}>
              {statusMutation.isPending ? 'Updating…' : 'Mark dispatched'}
            </Button>
          )}
          {order.status === 'DISPATCHED' && (
            <Button size="sm" onClick={() => statusMutation.mutate('COMPLETED')} disabled={busy}>
              {statusMutation.isPending ? 'Updating…' : 'Mark completed'}
            </Button>
          )}
        </>
      )}

      {processing && canCancel && (
        <>
          <div>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => setCancelOpen(true)}
              disabled={busy}
            >
              Cancel order
            </Button>
          </div>
          <CancelOrderDialog orderId={order.id} courierBooked={courier} open={cancelOpen} onOpenChange={setCancelOpen} />
        </>
      )}
    </div>
  );
}
