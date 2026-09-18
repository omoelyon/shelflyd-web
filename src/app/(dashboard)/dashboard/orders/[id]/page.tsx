'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api/orders';
import { deliveryApi } from '@/lib/api/delivery';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import StatusBadge from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Package, MapPin, Calendar, Hash, Truck, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import type { Order, OrderItem, OrderStatus } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

function nextStatuses(order: Order): OrderStatus[] {
  const { status, orderType } = order;
  switch (status) {
    case 'PAID':               return ['PREPARING'];
    case 'PREPARING':          return orderType === 'DELIVERY' ? ['READY_FOR_DELIVERY'] : ['READY_FOR_PICKUP'];
    case 'READY_FOR_DELIVERY': return ['OUT_FOR_DELIVERY'];
    case 'OUT_FOR_DELIVERY':   return ['DELIVERED'];
    case 'READY_FOR_PICKUP':   return ['PICKED_UP'];
    default:                   return [];
  }
}

const statusLabels: Partial<Record<OrderStatus, string>> = {
  PREPARING:           'Preparing',
  READY_FOR_PICKUP:    'Ready for Pickup',
  READY_FOR_DELIVERY:  'Ready for Delivery',
  OUT_FOR_DELIVERY:    'Out for Delivery',
  DELIVERED:           'Delivered',
  PICKED_UP:           'Picked Up',
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const orderId = Number(id);
  const router = useRouter();
  const qc = useQueryClient();
  // Base UI's Select only reliably renders its dropdown content on its first open —
  // reopening the same mounted instance (confirmed live: works once, then opens empty
  // every time after, with no page reload) silently shows nothing. Forcing a remount
  // on every close guarantees the next open is always a fresh instance.
  const [statusSelectKey, setStatusSelectKey] = useState(0);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => ordersApi.getById(orderId),
    enabled: !isNaN(orderId),
  });

  const { data: deliveryLocations } = useQuery({
    queryKey: ['delivery-locations', order?.businessId],
    queryFn: () => deliveryApi.listByBusiness(order!.businessId),
    enabled: !!order,
  });

  const { data: orderItems } = useQuery({
    queryKey: ['order-items', orderId],
    queryFn: () => ordersApi.getItems(orderId),
    enabled: !!order,
  });

  const { data: shipment } = useQuery({
    queryKey: ['order-shipment', orderId],
    queryFn: () => ordersApi.getShipment(orderId),
    enabled: !!order,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateStatus(orderId, status),
    onSuccess: () => {
      toast.success('Order status updated!');
      qc.invalidateQueries({ queryKey: ['order-detail', orderId] });
      qc.invalidateQueries({ queryKey: ['business-orders'] });
      qc.invalidateQueries({ queryKey: ['business-stats'] });
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to update status.')),
  });

  const deliveryLocation = deliveryLocations?.find(
    (l) => l.id === order?.deliveryLocationId,
  );

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="text-center py-16">
        <p className="text-[#64748b] mb-4">Order not found.</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const actions = nextStatuses(order);
  const formattedDate = order.createdAt
    ? format(new Date(order.createdAt.replace(' ', 'T')), 'dd MMM yyyy, HH:mm')
    : '—';

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title={`Order #${order.id}`}
        subtitle={`Placed on ${formattedDate}`}
        action={
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              All Orders
            </Button>
          </Link>
        }
      />

      {/* Status card */}
      <div className="bg-white rounded-2xl shadow-card-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-[#091426] font-heading">Order Status</h2>
          <StatusBadge status={order.status} type="order" />
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-3">
            <p className="text-xs text-[#64748b]">Advance to:</p>
            <Select
              key={statusSelectKey}
              value=""
              disabled={updateStatusMutation.isPending}
              onValueChange={(s) => updateStatusMutation.mutate(s as OrderStatus)}
              onOpenChange={(open) => { if (!open) setStatusSelectKey((k) => k + 1); }}
            >
              <SelectTrigger className="h-8 text-xs w-52 border-[rgba(9,20,38,0.12)]">
                <SelectValue placeholder={updateStatusMutation.isPending ? 'Updating…' : 'Select next status'}>
                  {undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {actions.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    → {statusLabels[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Order details */}
      <div className="bg-white rounded-2xl shadow-card-md p-5">
        <h2 className="font-semibold text-sm text-[#091426] font-heading mb-4">Details</h2>

        <div className="space-y-3">
          <DetailRow icon={Hash} label="Order ID" value={`#${order.id}`} />
          <DetailRow icon={Truck} label="Order Type" value={order.orderType} />
          <DetailRow
            icon={Calendar}
            label="Created"
            value={formattedDate}
          />
          {order.updatedAt && (
            <DetailRow
              icon={Calendar}
              label="Last Updated"
              value={format(new Date(order.updatedAt.replace(' ', 'T')), 'dd MMM yyyy, HH:mm')}
            />
          )}
          {order.orderType === 'DELIVERY' && deliveryLocation && (
            <DetailRow
              icon={MapPin}
              label="Delivery Location"
              value={`${deliveryLocation.location} — ₦${deliveryLocation.amount.toLocaleString()}`}
            />
          )}
          {order.orderType === 'DELIVERY' && !deliveryLocation && order.deliveryLocationId && (
            <DetailRow icon={MapPin} label="Delivery Location ID" value={String(order.deliveryLocationId)} />
          )}
        </div>
      </div>

      {/* Courier tracking */}
      {shipment && (
        <div className="bg-white rounded-2xl shadow-card-md p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#eff4ff] flex items-center justify-center shrink-0">
              <Truck className="h-4 w-4 text-[#0058be]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#091426]">{shipment.courierName ?? 'Courier'}</p>
              <p className="text-xs text-[#64748b]">{shipment.status.replace(/_/g, ' ')}</p>
            </div>
          </div>
          {shipment.trackingUrl && (
            <a
              href={shipment.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#0058be] hover:text-[#091426] transition-colors shrink-0"
            >
              Track package <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Order items */}
      <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#f1f5f9]">
          <Package className="h-4 w-4 text-[#64748b]" />
          <h2 className="font-semibold text-sm text-[#091426] font-heading">
            Items ({orderItems?.length ?? '…'})
          </h2>
        </div>
        <div className="divide-y divide-[#f1f5f9]">
          {!orderItems ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-12 w-12 rounded-lg bg-[#f1f5f9] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-[#f1f5f9] rounded w-1/2" />
                    <div className="h-3 bg-[#f1f5f9] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : orderItems.length === 0 ? (
            <p className="p-5 text-sm text-[#64748b]">No items found.</p>
          ) : (
            orderItems.map((item: OrderItem) => (
              <div key={item.productId} className="flex items-center gap-3 px-5 py-3">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-lg object-cover shrink-0 bg-[#f1f5f9]"
                    unoptimized
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-[#f1f5f9] flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-[#cbd5e1]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#091426] truncate">{item.name}</p>
                  <p className="text-xs text-[#64748b]">
                    {item.quantity} {item.unit} × ₦{Number(item.unitPrice).toLocaleString()}
                  </p>
                  {item.note && (
                    <p className="text-xs italic text-[#64748b] mt-0.5">Note: {item.note}</p>
                  )}
                </div>
                <p className="text-sm font-semibold text-[#091426] shrink-0">
                  ₦{Number(item.totalPrice).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-7 w-7 rounded-lg bg-[#f8f9ff] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-[#64748b]" />
      </div>
      <div>
        <p className="text-[11px] text-[#64748b] uppercase tracking-wide leading-none">{label}</p>
        <p className="text-sm font-medium text-[#091426] mt-0.5">{value}</p>
      </div>
    </div>
  );
}
