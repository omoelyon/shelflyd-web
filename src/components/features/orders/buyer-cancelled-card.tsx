import { XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Order, OrderPaymentSummary } from '@/types';

/** What the buyer is told about their money once an order is cancelled. */
function refundMessage(summary: OrderPaymentSummary | undefined): string {
  const amount = summary?.refundAmount != null ? `₦${summary.refundAmount.toLocaleString()}` : null;
  if (summary?.refundStatus === 'REQUESTED') {
    return `We've refunded ${amount ?? 'your payment'} to the card or bank account you paid with. It can take 5 to 10 business days to show up.`;
  }
  if (summary?.refundStatus === 'FAILED') {
    return `We're processing your refund${amount ? ` of ${amount}` : ''} and will email you once it's on its way. Questions? Contact support.`;
  }
  return 'Your refund is being processed.';
}

/** Shown instead of the progress steps on a cancelled order: why it was cancelled and where the refund stands. */
export default function BuyerCancelledCard({ order, paymentSummary }: { order: Order; paymentSummary?: OrderPaymentSummary }) {
  const when = order.cancelledAt
    ? new Date(order.cancelledAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  return (
    <Card className="bg-red-50/60 ring-red-100">
      <CardContent className="py-5 space-y-2">
        <div className="flex items-center gap-2 text-red-800">
          <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="font-semibold">This order was cancelled{when ? ` on ${when}` : ''}</p>
        </div>
        {order.cancelReason && (
          <p className="text-sm text-red-900/80 break-words">
            <span className="font-medium">Reason:</span> {order.cancelReason}
          </p>
        )}
        <p className="text-sm text-red-900/80">{refundMessage(paymentSummary)}</p>
      </CardContent>
    </Card>
  );
}
