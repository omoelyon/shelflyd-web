'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { earningsApi } from '@/lib/api/earnings';
import { businessesApi } from '@/lib/api/businesses';
import { payoutApi } from '@/lib/api/payout';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import StatCard from '@/components/ui/stat-card';
import EmptyState from '@/components/ui/empty-state';
import PaginationControls from '@/components/ui/pagination-controls';
import { Wallet, CalendarDays, TrendingUp, ShoppingBag, Landmark, Download, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';

const naira = (value: number) => `₦${value.toLocaleString()}`;

export default function EarningsPage() {
  const [page, setPage] = useState(0);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['earnings-summary'],
    queryFn: earningsApi.getSummary,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['earnings-transactions', page],
    queryFn: () => earningsApi.getTransactions(page, 15),
  });

  const { data: revenueHistory, isLoading: chartLoading } = useQuery({
    queryKey: ['revenue-history', 30],
    queryFn: () => businessesApi.getRevenueHistory(30),
  });

  // Owner only — a team member's request is rejected, in which case the card is simply not shown.
  const { data: payoutAccount } = useQuery({
    queryKey: ['payout-account'],
    queryFn: payoutApi.getAccount,
    retry: false,
  });

  const exportMutation = useMutation({
    mutationFn: earningsApi.exportCsv,
    onError: (error) => toast.error(getApiError(error, 'Could not export your earnings.')),
  });

  const chartData = (revenueHistory ?? []).map((p) => ({
    ...p,
    label: format(parseISO(p.date), 'd MMM'),
  }));

  const statCards = summary
    ? [
        { label: 'Total earned', value: naira(summary.totalEarned), icon: Wallet, accent: '#0058be', bg: '#eff4ff' },
        { label: 'This month', value: naira(summary.thisMonth), icon: CalendarDays, accent: '#059669', bg: '#ecfdf5' },
        { label: 'Last 30 days', value: naira(summary.last30Days), icon: TrendingUp, accent: '#0891b2', bg: '#ecfeff' },
        {
          label: summary.paidOrders > 0 ? `Paid orders · avg ${naira(Math.round(summary.averageOrder))}` : 'Paid orders',
          value: summary.paidOrders,
          icon: ShoppingBag,
          accent: '#d97706',
          bg: '#fffbeb',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings"
        subtitle="What you receive from each paid order"
        action={
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={exportMutation.isPending || !transactions?.content?.length}
            onClick={() => exportMutation.mutate()}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {exportMutation.isPending ? 'Exporting…' : 'Export CSV'}
          </Button>
        }
      />

      {/* ── Stat cards ── */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}

      {/* ── Earnings over time ── */}
      <div className="bg-white rounded-2xl shadow-card-md p-5">
        <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-[0.1em] mb-4">
          Earnings · last 30 days
        </p>
        {chartLoading ? (
          <Skeleton className="h-52 rounded-xl" />
        ) : chartData.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-[#64748b] gap-2">
            <TrendingUp className="h-8 w-8 text-[#cbd5e1]" />
            <p className="text-sm">No earnings in the last 30 days</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={208}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0058be" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0058be" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(9,20,38,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₦${(v as number).toLocaleString()}`}
                width={72}
              />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(9,20,38,0.12)',
                  fontSize: '12px',
                }}
                formatter={(value) => [`₦${Number(value ?? 0).toLocaleString()}`, 'Earnings']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0058be"
                strokeWidth={2}
                fill="url(#earningsGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#0058be', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Payouts go to ── */}
      {payoutAccount && (
        payoutAccount.configured ? (
          <div className="bg-white rounded-2xl shadow-card-md p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-[#eff4ff] flex items-center justify-center shrink-0">
                <Landmark className="h-5 w-5 text-[#0058be]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-[0.1em]">Payouts go to</p>
                <p className="font-semibold text-sm text-[#091426] truncate">{payoutAccount.accountName}</p>
                <p className="text-xs text-[#64748b] truncate">
                  {payoutAccount.bankName} · {payoutAccount.accountNumberMasked}
                </p>
                <p className="text-xs text-[#64748b] mt-1">Paystack settles your earnings to this account automatically.</p>
              </div>
            </div>
            <Link href="/dashboard/settings/payout" className="text-xs font-medium text-[#0058be] hover:underline shrink-0">
              Change
            </Link>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-900">
                <span className="font-semibold">Add your payout account</span> so Paystack can settle your earnings to your bank.
              </p>
            </div>
            <Link href="/dashboard/settings/payout">
              <Button size="sm" className="h-8 text-xs shrink-0">Add account</Button>
            </Link>
          </div>
        )
      )}

      {/* ── Transactions ── */}
      <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f1f5f9]">
          <p className="font-semibold text-sm text-[#091426] font-heading">Earnings by order</p>
        </div>

        <div className="p-4">
          {transactionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : !transactions?.content?.length ? (
            <EmptyState
              icon={Wallet}
              title="No earnings yet"
              subtitle="What you earn from each paid order will appear here."
            />
          ) : (
            <div className="space-y-2">
              {transactions.content.map((row) => (
                <div
                  key={row.paymentId}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#f8f9ff] hover:bg-[#eff4ff] transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {row.orderId ? (
                        <Link
                          href={`/dashboard/orders/${row.orderId}`}
                          className="font-semibold text-sm text-[#0058be] hover:underline"
                        >
                          Order #{row.orderId}
                        </Link>
                      ) : (
                        <span className="font-semibold text-sm text-[#091426]">Payment</span>
                      )}
                      <span className="text-xs text-[#64748b]">
                        {row.paidAt ? format(new Date(row.paidAt), 'dd MMM yyyy, HH:mm') : '—'}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748b] font-mono truncate">{row.reference}</p>
                    {row.itemsAmount != null && (
                      <p className="text-xs text-[#64748b]">
                        Items {naira(row.itemsAmount)}
                        {row.deliveryFee != null && row.deliveryFee > 0 && !row.courierDelivery
                          ? ` + Delivery ${naira(row.deliveryFee)}`
                          : ''}
                        {row.courierDelivery ? ' · Courier delivery covered by Shelflyd' : ''}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 ml-4">
                    <p className="font-bold text-[#091426] font-heading text-sm">{naira(row.earnings)}</p>
                    <p className="text-xs text-[#64748b]">Customer paid {naira(row.customerPaid)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PaginationControls
        page={page}
        totalPages={transactions?.totalPages ?? 0}
        isFirst={transactions?.first ?? true}
        isLast={transactions?.last ?? true}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />

      <p className="text-xs text-[#64748b] px-1">
        Earnings are what you receive per order. The Shelflyd service fee and payment processing fee are paid by the
        customer; courier delivery costs are covered by Shelflyd.
      </p>
    </div>
  );
}
