'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import SellerStatusBadge from '@/components/features/orders/seller-status-badge';
import { cn } from '@/lib/utils';
import PaginationControls from '@/components/ui/pagination-controls';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { OrderStatus } from '@/types';

const FILTERS: { value: 'ALL' | OrderStatus; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function DashboardOrdersPage() {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'ALL' | OrderStatus>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['business-orders', page],
    queryFn: () => businessesApi.getOrders(page, 15),
  });

  // The filter applies to the page of orders that is loaded.
  const orders = (data?.content ?? []).filter((o) => filter === 'ALL' || o.status === filter);

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

        <div className="flex gap-2 overflow-x-auto px-4 pt-4" role="group" aria-label="Filter orders by status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                filter === f.value ? 'bg-[#091426] text-white' : 'bg-[#f1f5f9] text-[#334155] hover:bg-[#e2e8f0]',
              )}
            >
              {f.label}
            </button>
          ))}
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
          ) : orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#64748b]">No {FILTERS.find((f) => f.value === filter)?.label.toLowerCase()} orders on this page.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => {
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

                    <div className="flex items-center gap-3 shrink-0">
                      {order.stockShortfall && order.status === 'PROCESSING' && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">Stock short</span>
                      )}
                      <SellerStatusBadge order={order} />
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="flex items-center gap-1 text-xs text-[#0058be] hover:text-[#0046a0] font-medium transition-colors"
                      >
                        Details <ArrowRight className="h-3 w-3" />
                      </Link>
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
