'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import { ordersApi } from '@/lib/api/orders';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import StatusBadge from '@/components/ui/status-badge';
import PaginationControls from '@/components/ui/pagination-controls';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

/** Returns the statuses a merchant can manually advance to, given current status and order type. */
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

export default function DashboardOrdersPage() {
  const [page, setPage] = useState(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['business-orders', page],
    queryFn: () => businessesApi.getOrders(page, 15),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onMutate: ({ id }) => setUpdatingId(id),
    onSuccess: () => {
      toast.success('Order status updated!');
      qc.invalidateQueries({ queryKey: ['business-orders'] });
      qc.invalidateQueries({ queryKey: ['business-stats'] });
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to update order status.')),
    onSettled: () => setUpdatingId(null),
  });

  const statusLabels: Partial<Record<OrderStatus, string>> = {
    PREPARING:           'Preparing',
    READY_FOR_PICKUP:    'Ready for Pickup',
    READY_FOR_DELIVERY:  'Ready for Delivery',
    OUT_FOR_DELIVERY:    'Out for Delivery',
    DELIVERED:           'Delivered',
    PICKED_UP:           'Picked Up',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle={`${data?.totalElements ?? 0} total orders`}
      />

      {/* Orders card */}
      <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f1f5f9]">
          <p className="font-semibold text-sm text-[#091426] font-heading">Order History</p>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : !data?.content?.length ? (
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              subtitle="Orders will appear here once customers check out."
            />
          ) : (
            <div className="space-y-2">
              {data.content.map((order) => {
                const actions = nextStatuses(order);
                const isUpdating = updatingId === order.id;

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#f8f9ff] hover:bg-[#eff4ff] transition-colors gap-4"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-sm text-[#091426]">Order #{order.id}</p>
                      <p className="text-xs text-[#64748b]">
                        {order.orderType}
                        {order.createdAt && (
                          <> · {format(new Date(order.createdAt.replace(' ', 'T')), 'dd MMM yyyy, HH:mm')}</>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={order.status} type="order" />

                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="hidden sm:flex items-center gap-1 text-xs text-[#0058be] hover:text-[#0046a0] font-medium transition-colors"
                      >
                        Details <ArrowRight className="h-3 w-3" />
                      </Link>

                      {actions.length > 0 && (
                        <Select
                          disabled={isUpdating}
                          onValueChange={(status) =>
                            updateStatusMutation.mutate({ id: order.id, status: status as OrderStatus })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs w-40 border-[rgba(9,20,38,0.12)] bg-white">
                            <SelectValue placeholder={isUpdating ? 'Updating…' : 'Update status'} />
                          </SelectTrigger>
                          <SelectContent>
                            {actions.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                → {statusLabels[s] ?? s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PaginationControls
        page={page}
        totalPages={data?.totalPages ?? 0}
        isFirst={data?.first ?? true}
        isLast={data?.last ?? true}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />
    </div>
  );
}
