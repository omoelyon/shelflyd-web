'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api/payments';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import PaginationControls from '@/components/ui/pagination-controls';
import { CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page],
    queryFn: () => paymentsApi.adminList(page, 20),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Payments"
        subtitle={`${data?.totalElements ?? 0} total transactions across all businesses`}
      />

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(9,20,38,0.06)] overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-[#f1f5f9]">
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">#</p>
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Reference</p>
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Gateway</p>
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Amount</p>
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.1em]">Status</p>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : !data?.content?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#64748b]">
            <CreditCard className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-medium text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f8fafc]">
            {data.content.map((payment) => (
              <div
                key={payment.id}
                className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-[#f8fafc] transition-colors"
              >
                <p className="text-[13px] font-semibold text-[#64748b] tabular-nums w-8">
                  {payment.id}
                </p>
                <div>
                  <p className="text-[13px] font-medium text-[#091426] font-mono">
                    {payment.reference}
                  </p>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">
                    {payment.createdAt ? format(new Date(payment.createdAt), 'dd MMM yyyy, HH:mm') : '—'}
                  </p>
                </div>
                <p className="hidden sm:block text-[12px] text-[#64748b] bg-[#f1f5f9] rounded-md px-2 py-0.5 font-medium uppercase">
                  {payment.paymentGateway ?? '—'}
                </p>
                <p className="hidden sm:block text-[13px] font-semibold text-[#091426] tabular-nums">
                  ₦{Number(payment.amount ?? 0).toLocaleString()}
                </p>
                <span
                  className={`hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    payment.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {(data?.totalPages ?? 0) > 1 && (
        <PaginationControls
          page={page}
          totalPages={data?.totalPages ?? 1}
          isFirst={page === 0}
          isLast={page + 1 >= (data?.totalPages ?? 1)}
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}
