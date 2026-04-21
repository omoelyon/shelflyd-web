'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { businessesApi } from '@/lib/api/businesses';
import { useThemeStore } from '@/stores/theme.store';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  Truck,
  Settings,
  ArrowUpRight,
  Store,
  BarChart3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn, formatStatus } from '@/lib/utils';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  CREATED: 'bg-slate-100 text-slate-600',
  PAID: 'bg-blue-50 text-blue-700',
  PREPARING: 'bg-orange-50 text-orange-700',
  READY_FOR_PICKUP: 'bg-indigo-50 text-indigo-700',
  READY_FOR_DELIVERY: 'bg-indigo-50 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-cyan-50 text-cyan-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  PICKED_UP: 'bg-emerald-50 text-emerald-700',
};

export default function DashboardPage() {
  const loadFromBusiness = useThemeStore((s) => s.loadFromBusiness);

  const { data: business, isLoading: bizLoading } = useQuery({
    queryKey: ['business-profile'],
    queryFn: businessesApi.getProfile,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['business-stats'],
    queryFn: businessesApi.getStats,
  });

  const { data: ordersPage, isLoading: ordersLoading } = useQuery({
    queryKey: ['business-orders', 0],
    queryFn: () => businessesApi.getOrders(0, 5),
  });

  useEffect(() => {
    if (business) loadFromBusiness(business);
  }, [business, loadFromBusiness]);

  const statCards = stats
    ? [
        { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, accent: '#0058be', bg: '#eff4ff' },
        { label: 'Paid Orders', value: stats.paidOrders, icon: CreditCard, accent: '#059669', bg: '#ecfdf5' },
        { label: 'Preparing', value: stats.preparingOrders, icon: Package, accent: '#d97706', bg: '#fffbeb' },
        { label: 'Delivered', value: stats.deliveredOrders, icon: CheckCircle, accent: '#0058be', bg: '#eff4ff' },
        { label: 'Pending', value: stats.createdOrders, icon: Clock, accent: '#b45309', bg: '#fef3c7' },
        { label: 'Out for Delivery', value: stats.pickedUpOrders, icon: Truck, accent: '#0891b2', bg: '#ecfeff' },
      ]
    : [];

  return (
    <div className="space-y-5">
      {/* Business profile banner */}
      {bizLoading ? (
        <Skeleton className="h-20 rounded-2xl" />
      ) : business ? (
        <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-[0_2px_12px_rgba(9,20,38,0.06)]">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md"
            style={{
              backgroundColor: business.themeColor ?? '#091426',
              boxShadow: `0 4px 12px ${business.themeColor ?? '#091426'}40`,
            }}
          >
            {business.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="font-bold text-base truncate text-[#091426]"
              style={{ fontFamily: 'var(--font-manrope)' }}
            >
              {business.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                  business.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : business.status === 'PENDING'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {formatStatus(business.status)}
              </span>
              {business.status === 'PENDING' && (
                <span className="text-xs text-[#64748b]">Awaiting admin approval</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/storefront/${business.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0058be] hover:text-[#091426] transition-colors"
            >
              <Store className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Store</span>
            </Link>
            <Link href="/dashboard/settings" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0 text-xs h-8')}>
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Settings
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white rounded-2xl shadow-[0_2px_12px_rgba(9,20,38,0.06)] text-center">
          <div className="h-12 w-12 rounded-xl bg-[#eff4ff] flex items-center justify-center mx-auto mb-3">
            <Store className="h-6 w-6 text-[#0058be]" />
          </div>
          <p className="text-[#64748b] mb-4 text-sm">You haven&apos;t registered a business yet.</p>
          <Link href="/dashboard/register-business" className="inline-flex items-center justify-center h-9 px-5 rounded-lg text-sm font-semibold bg-[#091426] text-white hover:bg-[#091426]/90 transition-colors">
            Register Business
          </Link>
        </div>
      )}

      {/* Revenue card — navy/blue signature gradient */}
      {stats && (
        <div
          className="rounded-2xl p-6 text-white relative overflow-hidden shadow-lg"
          style={{ background: 'linear-gradient(135deg, #091426 0%, #0058be 100%)' }}
        >
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/6" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/6" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1.5">Total Revenue</p>
              <p
                className="text-4xl font-bold"
                style={{ fontFamily: 'var(--font-manrope)' }}
              >
                ₦{stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <Link
                href="/dashboard/payments"
                className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
              >
                View details <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          {/* Sparkline placeholder bars */}
          <div className="relative flex items-end gap-1 mt-5 h-8">
            {[40, 65, 50, 80, 60, 90, 75, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-white/20"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* KPI bento grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {statCards.map(({ label, value, icon: Icon, accent, bg }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(9,20,38,0.05)] flex items-center gap-3.5"
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: bg }}
              >
                <Icon className="h-5 w-5" style={{ color: accent }} />
              </div>
              <div>
                <p
                  className="text-2xl font-bold text-[#091426]"
                  style={{ fontFamily: 'var(--font-manrope)' }}
                >
                  {value}
                </p>
                <p className="text-xs text-[#64748b] leading-tight mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/products"
          className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-[0_2px_12px_rgba(9,20,38,0.05)] hover:shadow-[0_4px_20px_rgba(9,20,38,0.1)] transition-all group"
        >
          <div className="h-9 w-9 rounded-xl bg-[#eff4ff] flex items-center justify-center">
            <Package className="h-4.5 w-4.5 text-[#0058be]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#091426]">Products</p>
            <p className="text-xs text-[#64748b]">Manage catalog</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-[#64748b] group-hover:text-[#0058be] transition-colors" />
        </Link>
        <Link
          href="/dashboard/orders"
          className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-[0_2px_12px_rgba(9,20,38,0.05)] hover:shadow-[0_4px_20px_rgba(9,20,38,0.1)] transition-all group"
        >
          <div className="h-9 w-9 rounded-xl bg-[#eff4ff] flex items-center justify-center">
            <BarChart3 className="h-4.5 w-4.5 text-[#0058be]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#091426]">Orders</p>
            <p className="text-xs text-[#64748b]">Track & fulfill</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-[#64748b] group-hover:text-[#0058be] transition-colors" />
        </Link>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(9,20,38,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9]">
          <h3
            className="font-bold text-sm text-[#091426]"
            style={{ fontFamily: 'var(--font-manrope)' }}
          >
            Recent Orders
          </h3>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#0058be] hover:text-[#091426] transition-colors"
          >
            View All <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="p-3">
          {ordersLoading ? (
            <div className="space-y-2.5 p-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
            </div>
          ) : ordersPage?.content?.length === 0 ? (
            <p className="text-[#64748b] text-sm text-center py-8">No orders yet.</p>
          ) : (
            <div className="space-y-1">
              {ordersPage?.content.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#f8f9ff] transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[#0b1c30]">Order #{order.id}</p>
                    <p className="text-xs text-[#64748b]">{order.orderType} · {order.createdAt}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[11px] ${statusColors[order.status] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    {formatStatus(order.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
