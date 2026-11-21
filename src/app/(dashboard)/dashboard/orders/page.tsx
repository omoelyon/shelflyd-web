'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import SellerStatusBadge from '@/components/features/orders/seller-status-badge';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import PaginationControls from '@/components/ui/pagination-controls';
import { ShoppingBag, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Order } from '@/types';

type Filter = 'OPEN' | 'PROCESSING' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED' | 'ALL';

// "Needs action" first: it's what a seller opens this page for. Filtering happens on the server, so it covers every
// order, not just the ones on the page.
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'OPEN', label: 'Needs action' },
  { value: 'PROCESSING', label: 'Preparing' },
  { value: 'DISPATCHED', label: 'On the way' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'ALL', label: 'All' },
];

const fulfilment = (order: Order) => (order.orderType === 'DELIVERY' ? 'Delivery' : 'Pickup');

function summaryLine(order: Order): string {
  const parts = [fulfilment(order)];
  if (order.itemCount != null) parts.push(`${order.itemCount} ${order.itemCount === 1 ? 'item' : 'items'}`);
  if (order.itemsTotal != null) parts.push(formatMoney(order.itemsTotal));
  if (order.createdAt) parts.push(format(new Date(order.createdAt.replace(' ', 'T')), 'd MMM, HH:mm'));
  return parts.join(' · ');
}

export default function DashboardOrdersPage() {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<Filter>('OPEN');

  const { data, isLoading } = useQuery({
    queryKey: ['business-orders', 'list', filter, page],
    queryFn: () => businessesApi.getOrders(page, 15, filter),
  });

  const orders = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const subtitle =
    filter === 'OPEN'
      ? total === 0
        ? 'Nothing waiting on you'
        : `${total} ${total === 1 ? 'order needs' : 'orders need'} your attention`
      : `${total} ${total === 1 ? 'order' : 'orders'}`;

  const choose = (next: Filter) => {
    setFilter(next);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle={isLoading ? undefined : subtitle} />

      <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
        <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Show orders">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => choose(f.value)}
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
          ) : orders.length === 0 ? (
            filter === 'OPEN' ? (
              <EmptyState icon={CheckCircle2} title="You’re all caught up" subtitle="New orders that need preparing or sending show up here." />
            ) : filter === 'ALL' ? (
              <EmptyState icon={ShoppingBag} title="No orders yet" subtitle="Orders will appear here once customers check out." />
            ) : (
              <p className="py-8 text-center text-sm text-[#64748b]">No {FILTERS.find((f) => f.value === filter)?.label.toLowerCase()} orders.</p>
            )
          ) : (
            <ul className="space-y-2">
              {orders.map((order) => (
                <li key={order.id}>
                  {/* The whole row opens the order: a big tap target on phones. */}
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="group flex items-center justify-between gap-3 rounded-xl bg-[#f8f9ff] p-4 transition-colors hover:bg-[#eff4ff] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0058be]/40"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-semibold text-[#091426]">
                        Order #{order.id}
                        {order.buyerName && <span className="font-normal text-[#334155]"> · {order.buyerName}</span>}
                      </p>
                      <p className="text-xs leading-snug text-[#64748b] sm:truncate">{summaryLine(order)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {order.stockShortfall && order.status === 'PROCESSING' && (
                        <span className="hidden rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 sm:inline">Stock short</span>
                      )}
                      <SellerStatusBadge order={order} />
                      <ChevronRight className="h-4 w-4 text-[#94a3b8] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
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
