'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import PageHeader from '@/components/ui/page-header';
import ProductVisits from '@/components/features/analytics/product-visits';
import InsightsSection from '@/components/features/analytics/insights-section';
import StatCard from '@/components/ui/stat-card';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  CheckCircle,
  Truck,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const PERIODS = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
] as const;

type Period = (typeof PERIODS)[number]['days'];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>(30);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['business-stats'],
    queryFn: businessesApi.getStats,
  });

  const { data: revenueHistory, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-history', period],
    queryFn: () => businessesApi.getRevenueHistory(period),
  });

  const chartData = (revenueHistory ?? []).map((p) => ({
    ...p,
    label: format(parseISO(p.date), 'd MMM'),
  }));

  const statCards = stats
    ? [
        { label: 'Total Orders',    value: stats.totalOrders,     icon: ShoppingBag, accent: '#0058be', bg: '#eff4ff' },
        { label: 'Processing',       value: Math.max(0, stats.processingOrders - stats.readyForPickupOrders), icon: Package, accent: '#d97706', bg: '#fffbeb' },
        { label: 'Ready for pickup', value: stats.readyForPickupOrders, icon: CheckCircle, accent: '#4f46e5', bg: '#eef2ff' },
        { label: 'Dispatched',       value: stats.dispatchedOrders,     icon: Truck,       accent: '#0891b2', bg: '#ecfeff' },
        { label: 'Completed',        value: stats.completedOrders,      icon: CheckCircle, accent: '#059669', bg: '#ecfdf5' },
        { label: 'Cancelled',        value: stats.cancelledOrders,      icon: XCircle,     accent: '#dc2626', bg: '#fef2f2' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Revenue, orders and which products shoppers visit"
        action={
          <Link
            href="/dashboard/finance"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#eff4ff] px-3 py-2 text-xs font-semibold text-[#0058be] transition-colors hover:bg-[#dbe7ff]"
          >
            Profit &amp; reports
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {/* ── Day / week / month comparisons, what changed, and the products behind it ── */}
      <InsightsSection />

      {/* ── Revenue chart ── */}
      <div className="bg-white rounded-2xl shadow-card-md p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-[0.1em]">
              Revenue
            </p>
            {stats && (
              <p className="text-3xl font-bold text-[#091426] font-heading mt-0.5">
                ₦{stats.totalRevenue.toLocaleString()}
              </p>
            )}
          </div>

          {/* Period toggle */}
          <div className="flex items-center gap-1 bg-[#f8f9ff] rounded-xl p-1">
            {PERIODS.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  period === days
                    ? 'bg-[#091426] text-white shadow-sm'
                    : 'text-[#64748b] hover:text-[#091426]',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        {revenueLoading ? (
          <Skeleton className="h-52 rounded-xl" />
        ) : chartData.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-[#64748b] gap-2">
            <TrendingUp className="h-8 w-8 text-[#cbd5e1]" />
            <p className="text-sm">No revenue data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={208}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0058be" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0058be" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(9,20,38,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
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
                formatter={(value) => [`₦${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0058be"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#0058be', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Product visits ── */}
      <ProductVisits />

      {/* ── KPI bento ── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}
    </div>
  );
}
