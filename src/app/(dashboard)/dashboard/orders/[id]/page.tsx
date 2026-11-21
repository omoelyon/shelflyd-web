'use client';

import { Suspense, use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api/orders';
import { deliveryApi } from '@/lib/api/delivery';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import { OrderItemsList, PackingList } from '@/components/features/orders/set-summary';
import SellerStatusBadge from '@/components/features/orders/seller-status-badge';
import SellerOrderActions from '@/components/features/orders/seller-order-actions';
import { displayOrderStatus } from '@/lib/order-status';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, MapPin, Calendar, Hash, Truck, ExternalLink, User, Phone, KeyRound, FileText } from 'lucide-react';
import { SELLER_DOCUMENTS } from '@/components/features/documents/format';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import type { OrderItem } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const orderId = Number(id);
  const router = useRouter();

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

  const { data: shipment, isLoading: shipmentLoading } = useQuery({
    queryKey: ['order-shipment', orderId],
    queryFn: () => ordersApi.getShipment(orderId),
    enabled: !!order,
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

  const status = displayOrderStatus(order, 'seller');
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-sm text-[#091426] font-heading">Order Status</h2>
          <SellerStatusBadge order={order} />
        </div>
        {order.status !== 'CANCELLED' && <p className="text-xs text-[#64748b]">{status.detail}</p>}

        <SellerOrderActions order={order} shipment={shipment} shipmentLoading={shipmentLoading} />
      </div>

      {order.stockShortfall && order.status === 'PROCESSING' && (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-1">
          <p className="text-sm font-semibold text-amber-900">Stock ran short on this order</p>
          <p className="text-xs text-amber-900">
            {order.stockShortfall}. The buyer has already paid. If you have more on hand, go ahead and prepare it. If not,
            cancel the order and they are refunded in full.
          </p>
        </div>
      )}

      {order.orderType === 'PICKUP' && order.status === 'PROCESSING' && (
        <Suspense>
          <PickupConfirmSlot orderId={orderId} ready={!!order.readyForPickupAt} />
        </Suspense>
      )}

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

      {orderItems && <PackingList items={orderItems} />}

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
            <OrderItemsList
              tone="seller"
              items={orderItems}
              renderItem={(item: OrderItem) => (
              <div className="flex items-center gap-3 px-5 py-3">
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
            )}
            />
          )}
        </div>

        {/* SHF-14: line items alone don't say what the order actually came to — a seller
            or buyer had no way to see subtotal / delivery fee / grand total at a glance. */}
        {orderItems && orderItems.length > 0 && (() => {
          const subtotal = orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
          const deliveryFee = order.orderType === 'DELIVERY'
            ? (deliveryLocation?.amount ?? shipment?.cost ?? 0)
            : 0;
          const grandTotal = subtotal + deliveryFee;
          return (
            <div className="border-t border-[#f1f5f9] px-5 py-3 space-y-1.5">
              <div className="flex items-center justify-between text-sm text-[#64748b]">
                <span>Subtotal</span>
                <span className="tabular-nums">₦{subtotal.toLocaleString()}</span>
              </div>
              {order.orderType === 'DELIVERY' && (
                <div className="flex items-center justify-between text-sm text-[#64748b]">
                  <span>Delivery fee</span>
                  <span className="tabular-nums">₦{deliveryFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-semibold text-[#091426] pt-1.5 border-t border-[#f1f5f9]">
                <span>Total</span>
                <span className="tabular-nums">₦{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Order details: reference info, after what needs packing */}
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
              label="Delivery Zone"
              value={`${deliveryLocation.location} — ₦${deliveryLocation.amount.toLocaleString()}`}
            />
          )}
          {order.orderType === 'DELIVERY' && !deliveryLocation && order.deliveryLocationId && (
            <DetailRow icon={MapPin} label="Delivery Location ID" value={String(order.deliveryLocationId)} />
          )}
          {order.orderType === 'DELIVERY' && order.deliveryContactName && (
            <DetailRow icon={User} label="Recipient" value={order.deliveryContactName} />
          )}
          {order.orderType === 'DELIVERY' && order.deliveryContactPhone && (
            <DetailRow icon={Phone} label="Recipient Phone" value={order.deliveryContactPhone} />
          )}
          {order.orderType === 'DELIVERY' && order.deliveryAddressLine && (
            <DetailRow
              icon={MapPin}
              label="Delivery Address"
              value={[order.deliveryAddressLine, order.deliveryCity, order.deliveryState].filter(Boolean).join(', ')}
            />
          )}
        </div>
      </div>

      {/* Documents: receipt, invoice, delivery note, and a credit note once the order is cancelled */}
      <div className="bg-white rounded-2xl shadow-card-md p-5">
        <h2 className="font-semibold text-sm text-[#091426] font-heading">Documents</h2>
        <p className="mt-1 text-xs text-[#64748b]">Open one to print it or save it as a PDF for your records or the buyer.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SELLER_DOCUMENTS.filter((d) => d.type !== 'credit-note' || order.status === 'CANCELLED').map((d) => (
            <Link key={d.type} href={`/dashboard/orders/${orderId}/document?type=${d.type}`} title={d.hint}>
              <Button variant="outline" size="sm" className="text-xs">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                {d.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Where the pickup code goes. Before the order is marked ready it's a single line ("Buyer here to collect?") so the
 * items to prepare stay near the top; once it's ready, or when a scanned pass brings a code in the address, it's open.
 */
function PickupConfirmSlot({ orderId, ready }: { orderId: number; ready: boolean }) {
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  if (ready || open || params.get('pickup')) return <ConfirmPickupCard orderId={orderId} />;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex w-full items-center gap-2 rounded-2xl bg-white p-4 text-left text-sm text-[#334155] shadow-card-md transition-colors hover:bg-[#f8f9ff]"
    >
      <KeyRound className="h-4 w-4 shrink-0 text-[#0058be]" aria-hidden="true" />
      <span className="flex-1">Buyer here to collect? Enter their pickup code</span>
    </button>
  );
}

function ConfirmPickupCard({ orderId }: { orderId: number }) {
  const qc = useQueryClient();
  const params = useSearchParams();
  // Scanning the buyer's pass QR lands here with ?pickup=<code>
  const [code, setCode] = useState(() => (params.get('pickup') ?? '').replace(/\D/g, '').slice(0, 6));

  const verifyMutation = useMutation({
    mutationFn: () => ordersApi.verifyPickup(orderId, code),
    onSuccess: () => {
      toast.success('Order handed over');
      qc.invalidateQueries({ queryKey: ['order-detail', orderId] });
      qc.invalidateQueries({ queryKey: ['business-orders'] });
      qc.invalidateQueries({ queryKey: ['business-stats'] });
    },
    onError: (error) => toast.error(getApiError(error, 'Could not verify this pickup code.')),
  });

  return (
    <div className="bg-white rounded-2xl shadow-card-md p-5 space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-[#64748b]" />
        <h2 className="font-semibold text-sm text-[#091426] font-heading">Confirm pickup</h2>
      </div>
      <p className="text-xs text-[#64748b]">
        Ask the person collecting for the 6-digit pickup code from the buyer&apos;s pass (or scan its QR) before handing over the order.
      </p>
      <div className="flex items-center gap-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="000000"
          aria-label="Pickup code"
          className="h-9 w-36 rounded-lg border border-[rgba(9,20,38,0.12)] px-3 text-center text-sm tracking-widest tabular-nums outline-none focus:border-[#0058be]"
        />
        <Button
          size="sm"
          disabled={code.length !== 6 || verifyMutation.isPending}
          onClick={() => verifyMutation.mutate()}
        >
          {verifyMutation.isPending ? 'Checking…' : 'Confirm handover'}
        </Button>
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
