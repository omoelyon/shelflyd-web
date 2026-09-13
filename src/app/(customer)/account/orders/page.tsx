'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api/orders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BusinessAvatar from '@/components/layout/business-avatar';
import { useReorder } from '@/hooks/use-reorder';
import { ShoppingBag, ChevronLeft, ChevronRight, Store, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { Business, OrderStatus } from '@/types';

const statusColor: Record<OrderStatus | string, string> = {
  CREATED:   'bg-slate-100 text-slate-700',
  PAID:      'bg-blue-100 text-blue-700',
  PREPARING: 'bg-amber-100 text-amber-700',
  DELIVERED: 'bg-green-100 text-green-700',
  PICKED_UP: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function MyOrdersPage() {
  const [page, setPage] = useState(0);
  const size = 15;
  const reorder = useReorder();

  const { data, isLoading } = useQuery({
    queryKey: ['my-customer-orders', page],
    queryFn: () => ordersApi.getMyCustomerOrders(page, size),
  });

  const { data: patronized } = useQuery({
    queryKey: ['my-patronized-businesses'],
    queryFn: ordersApi.getMyPatronizedBusinesses,
  });

  const businessMap = new Map<number, Business>((patronized ?? []).map((p) => [p.business.id, p.business]));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/account" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[#091426]">My Orders</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !data?.content?.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No orders yet</p>
          <p className="text-sm mt-1">Start shopping to see your orders here.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
            Browse stores
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.content.map((order) => {
              const business = businessMap.get(order.businessId);
              const isReordering = reorder.isPending && reorder.variables === order.id;
              return (
                <div key={order.id} className="p-4 rounded-xl border border-border bg-white">
                  <div className="flex items-center gap-3">
                    {business ? (
                      <BusinessAvatar business={business} size={40} className="rounded-lg shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
                    )}
                    <Link href={`/account/orders/${order.id}`} className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#091426] truncate">
                        {business?.name ?? `Order #${order.id}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Order #{order.id} · {order.orderType ?? 'Standard order'}
                        {order.deliveryLocationId ? ' · Delivery' : ''}
                      </p>
                    </Link>
                    <Badge
                      className={`text-xs font-medium border-0 shrink-0 ${statusColor[order.status] ?? 'bg-slate-100 text-slate-700'}`}
                    >
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      disabled={isReordering}
                      onClick={() => reorder.mutate(order.id)}
                    >
                      <RotateCcw className="h-3 w-3 mr-1.5" />
                      {isReordering ? 'Adding…' : 'Reorder'}
                    </Button>
                    {business && (
                      <Link
                        href={`/storefront/${business.slug}`}
                        className="inline-flex items-center justify-center gap-1.5 h-7 px-3 text-xs font-medium rounded-md border border-input hover:bg-accent transition-colors flex-1"
                      >
                        <Store className="h-3 w-3" />
                        Visit store
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {(data.totalPages ?? 1) > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= (data.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
