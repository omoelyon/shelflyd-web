'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { ordersApi } from '@/lib/api/orders';
import { deliveryApi } from '@/lib/api/delivery';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Package, MapPin } from 'lucide-react';
import type { OrderStatus } from '@/types';

const statusColor: Record<OrderStatus | string, string> = {
  CREATED: 'bg-slate-100 text-slate-700',
  PAID: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-amber-100 text-amber-700',
  READY_FOR_PICKUP: 'bg-amber-100 text-amber-700',
  READY_FOR_DELIVERY: 'bg-amber-100 text-amber-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  PICKED_UP: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: Props) {
  const { id } = use(params);
  const orderId = Number(id);

  const { data: order, isLoading: orderLoading, isError } = useQuery({
    queryKey: ['my-order', orderId],
    queryFn: () => ordersApi.getMyOrderById(orderId),
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['my-order-items', orderId],
    queryFn: () => ordersApi.getMyOrderItems(orderId),
    enabled: !!order,
  });

  const { data: deliveryLocation } = useQuery({
    queryKey: ['delivery-location', order?.deliveryLocationId],
    queryFn: () => deliveryApi.getById(order!.deliveryLocationId!),
    enabled: !!order?.deliveryLocationId,
  });

  const total = items?.reduce((acc, item) => acc + item.totalPrice, 0) ?? 0;

  if (orderLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center space-y-4">
        <p className="text-muted-foreground">Order not found.</p>
        <Link href="/account/orders" className="text-sm text-primary hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/account/orders" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[#091426]">Order #{order.id}</h1>
        <Badge className={`text-xs font-medium border-0 ${statusColor[order.status] ?? 'bg-slate-100 text-slate-700'}`}>
          {order.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {order.orderType === 'DELIVERY' ? 'Delivery' : 'Pickup'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {order.orderType === 'DELIVERY' ? (
            <p className="text-sm text-muted-foreground">
              {deliveryLocation?.location ?? 'Delivery details unavailable'}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">This order will be picked up in person.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {itemsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : !items?.length ? (
            <p className="text-sm text-muted-foreground">No items found for this order.</p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/40">
                <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.unit} · {item.quantity}x · ₦{item.unitPrice.toLocaleString()} each
                  </p>
                </div>
                <p className="font-semibold text-primary shrink-0">₦{item.totalPrice.toLocaleString()}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {!!items?.length && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-xl font-bold text-primary">₦{total.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
