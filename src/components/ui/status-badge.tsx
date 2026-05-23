import { cn } from '@/lib/utils';
import { formatStatus } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  orderStatusColors,
  paymentStatusColors,
  businessStatusColors,
  gatewayColors,
  teamRoleColors,
  inviteStatusColors,
  productStatusColors,
} from '@/lib/constants/status-colors';

type StatusType = 'order' | 'payment' | 'business' | 'gateway' | 'role' | 'invite' | 'product';

interface StatusBadgeProps {
  status: string;
  /** Which colour map to look up. Defaults to 'order'. */
  type?: StatusType;
  /** Skip formatStatus and show the raw value */
  raw?: boolean;
  className?: string;
}

const colorMaps: Record<StatusType, Record<string, string>> = {
  order:   orderStatusColors,
  payment: paymentStatusColors,
  business: businessStatusColors,
  gateway: gatewayColors,
  role:    teamRoleColors,
  invite:  inviteStatusColors,
  product: productStatusColors,
};

/**
 * Renders a coloured badge for any domain status.
 *
 * Usage:
 *   <StatusBadge status={order.status} type="order" />
 *   <StatusBadge status={payment.paymentGateway} type="gateway" raw />
 */
export default function StatusBadge({
  status,
  type = 'order',
  raw = false,
  className,
}: StatusBadgeProps) {
  const map = colorMaps[type] ?? {};
  const colorClass = map[status] ?? 'bg-slate-100 text-slate-600';

  return (
    <Badge
      variant="secondary"
      className={cn('text-[11px] font-medium border-0', colorClass, className)}
    >
      {raw ? status : formatStatus(status)}
    </Badge>
  );
}
