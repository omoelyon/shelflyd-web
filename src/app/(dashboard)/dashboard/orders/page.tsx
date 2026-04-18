'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; className: string }> = {
  CREATED: { label: 'Created', className: 'bg-gray-100 text-gray-700' },
  PAID: { label: 'Paid', className: 'bg-blue-100 text-blue-700' },
  PREPARING: { label: 'Preparing', className: 'bg-orange-100 text-orange-700' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', className: 'bg-indigo-100 text-indigo-700' },
  READY_FOR_DELIVERY: { label: 'Ready for Delivery', className: 'bg-indigo-100 text-indigo-700' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', className: 'bg-cyan-100 text-cyan-700' },
  DELIVERED: { label: 'Delivered', className: 'bg-green-100 text-green-700' },
  PICKED_UP: { label: 'Picked Up', className: 'bg-green-100 text-green-700' },
};

export default function DashboardOrdersPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['business-orders', page],
    queryFn: () => businessesApi.getOrders(page, 15),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {data?.totalElements ?? 0} total orders
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : data?.content?.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No orders yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.content.map((order) => {
                const status = statusConfig[order.status] ?? { label: order.status, className: 'bg-gray-100 text-gray-700' };
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-white"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm">Order #{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.orderType} ·{' '}
                        {order.createdAt
                          ? format(new Date(order.createdAt.replace(' ', 'T')), 'dd MMM yyyy, HH:mm')
                          : '—'}
                      </p>
                    </div>
                    <Badge variant="secondary" className={status.className}>
                      {status.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" disabled={data.first} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pageable.pageNumber + 1} of {data.totalPages}
          </span>
          <Button variant="outline" disabled={data.last} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
