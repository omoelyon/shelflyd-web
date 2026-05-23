'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import StatusBadge from '@/components/ui/status-badge';
import PaginationControls from '@/components/ui/pagination-controls';
import { CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPaymentsPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['business-payments', page],
    queryFn: () => businessesApi.getPayments(page, 15),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle={`${data?.totalElements ?? 0} total transactions`}
      />

      {/* Payments card */}
      <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f1f5f9]">
          <p className="font-semibold text-sm text-[#091426] font-heading">Payment History</p>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : !data?.content?.length ? (
            <EmptyState
              icon={CreditCard}
              title="No payments yet"
              subtitle="Payment transactions will appear here after customers complete checkout."
            />
          ) : (
            <div className="space-y-2">
              {data.content.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#f8f9ff] hover:bg-[#eff4ff] transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-sm text-[#091426] truncate">
                      {payment.reference}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge
                        status={payment.paymentGateway}
                        type="gateway"
                        raw
                      />
                      <span className="text-xs text-[#64748b]">
                        {payment.createdAt
                          ? format(new Date(payment.createdAt.replace(' ', 'T')), 'dd MMM yyyy, HH:mm')
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-4">
                    <p className="font-bold text-[#091426] font-heading text-sm">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </p>
                    <StatusBadge status={payment.status} type="payment" />
                  </div>
                </div>
              ))}
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
