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
import { displayOrderStatus } from '@/lib/order-status';
import { orderStatusColors } from '@/lib/constants/status-colors';
import { cn } from '@/lib/utils';
import type { Business, Order } from '@/types';

type OrderFilter = 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const FILTERS: { value: OrderFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

/** "In progress" covers everything that is not finished: processing, ready for pickup and dispatched. */
const matchesFilter = (order: Order, filter: OrderFilter) => {
  switch (filter) {
    case 'IN_PROGRESS':
      return order.status === 'PROCESSING' || order.status === 'DISPATCHED';
    case 'COMPLETED':
      return order.status === 'COMPLETED';
    case 'CANCELLED':
      return order.status === 'CANCELLED';
    default:
      return true;
  }
};

export default function MyOrdersPage() {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<OrderFilter>('ALL');
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
  const visibleOrders = (data?.content ?? []).filter((o) => matchesFilter(o, filter));

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
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter orders by status">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={cn(
                  'h-8 px-3 rounded-full text-xs font-medium border transition-colors',
                  filter === f.value
                    ? 'bg-[#091426] text-white border-[#091426]'
                    : 'bg-white text-muted-foreground border-border hover:bg-muted/50',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {visibleOrders.length === 0 && (
            <p className="text-center py-10 text-sm text-muted-foreground">
              No {FILTERS.find((f) => f.value === filter)?.label.toLowerCase()} orders on this page.
            </p>
          )}

          <div className="space-y-3">
            {visibleOrders.map((order) => {
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
                    {(() => {
                      const status = displayOrderStatus(order, 'buyer');
                      return (
                        <Badge className={`text-xs font-medium border-0 shrink-0 ${orderStatusColors[status.tone]}`}>
                          {status.label}
                        </Badge>
                      );
                    })()}
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
