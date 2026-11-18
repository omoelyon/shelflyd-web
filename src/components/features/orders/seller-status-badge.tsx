import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { orderStatusColors } from '@/lib/constants/status-colors';
import { displayOrderStatus } from '@/lib/order-status';
import type { Order } from '@/types';

/** An order's status as the seller should read it (a ready pickup order shows "Ready for pickup"). */
export default function SellerStatusBadge({
  order,
  className,
}: {
  order: Pick<Order, 'status' | 'orderType' | 'readyForPickupAt'>;
  className?: string;
}) {
  const { label, tone } = displayOrderStatus(order, 'seller');
  return (
    <Badge
      variant="secondary"
      className={cn('text-[11px] font-medium border-0', orderStatusColors[tone] ?? 'bg-slate-100 text-slate-600', className)}
    >
      {label}
    </Badge>
  );
}
