'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api/orders';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import StatusBadge from '@/components/ui/status-badge';
import PaginationControls from '@/components/ui/pagination-controls';
import { ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminOrdersPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page],
    queryFn: () => ordersApi.adminList(page, 20),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Orders"
        subtitle={`${data?.totalElements ?? 0} total orders across all businesses`}
      />

      <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-[#f1f5f9]">
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">#</p>
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Info</p>
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Type</p>
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Status</p>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : !data?.content?.length ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet"
            subtitle="Orders across all businesses will appear here."
          />
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {data.content.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f8f9ff] transition-colors"
              >
                <p className="text-xs font-mono text-[#94a3b8] w-10 shrink-0">#{order.id}</p>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#091426]">
                    Business #{order.businessId}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {order.createdAt
                      ? format(new Date(order.createdAt.replace(' ', 'T')), 'dd MMM yyyy, HH:mm')
                      : '—'}
                  </p>
                </div>

                <span className="hidden sm:inline text-xs text-[#64748b] shrink-0">
                  {order.orderType}
                </span>

                <StatusBadge status={order.status} type="order" />
              </div>
            ))}
          </div>
        )}
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
