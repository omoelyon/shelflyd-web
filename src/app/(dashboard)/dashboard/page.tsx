'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { businessesApi } from '@/lib/api/businesses';
import { payoutApi } from '@/lib/api/payout';
import { subscriptionApi } from '@/lib/api/subscription';
import { useThemeStore } from '@/stores/theme.store';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/ui/status-badge';
import { TrendingUp, Settings, ArrowUpRight, Store, Share2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn, formatStatus } from '@/lib/utils';
import { businessStatusColors } from '@/lib/constants/status-colors';
import Link from 'next/link';
import SetupChecklist, { SetupChecklistSkeleton } from '@/components/features/dashboard/setup-checklist';
import StoreLinkCard, { StoreLinkCardSkeleton } from '@/components/features/dashboard/store-link-card';
import AttentionCard from '@/components/features/dashboard/attention-card';
import OrdersAtAGlance from '@/components/features/dashboard/orders-at-a-glance';
import { SubscriptionBanner, PayoutReminder } from '@/components/features/dashboard/dashboard-banners';

export default function DashboardPage() {
  const loadFromBusiness = useThemeStore((s) => s.loadFromBusiness);

  const { data: business, isLoading: bizLoading } = useQuery({
    queryKey: ['business-profile'],
    queryFn: businessesApi.getProfile,
  });

  // Team members may not be allowed to read this — an error simply hides the banner.
  const { data: payoutAccount } = useQuery({
    queryKey: ['payout-account'],
    queryFn: payoutApi.getAccount,
    retry: false,
  });

  // Owner-only; an error (team member, no business yet) simply hides the banner.
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.get,
    retry: false,
  });

  // Which setup steps are done. An error (team member, older backend) just hides the checklist.
  const { data: setupStatus, isLoading: setupLoading } = useQuery({
    queryKey: ['setup-status'],
    queryFn: businessesApi.getSetupStatus,
    retry: false,
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

  return (
    <div className="space-y-5">
      {/* ── Most urgent first: trial ending, grace period, or lapsed ── */}
      <SubscriptionBanner subscription={subscription} />

      {/* ── Business profile banner ── */}
      {/* The dashboard layout only renders this page once it's confirmed the
          user has a business, so `business` is always present once loaded. */}
      {bizLoading || !business ? (
        <Skeleton className="h-20 rounded-2xl" />
      ) : (
        <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-card-md">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{
              backgroundColor: business.themeColor ?? '#091426',
              boxShadow: `0 4px 12px ${business.themeColor ?? '#091426'}40`,
            }}
          >
            {business.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base truncate text-[#091426] font-heading">
              {business.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={cn(
                  'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full',
                  businessStatusColors[business.status] ?? 'bg-slate-100 text-slate-600',
                )}
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
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0058be] hover:text-[#091426] transition-colors"
            >
              <Store className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View store</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0 text-xs h-8')}
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Settings
            </Link>
          </div>
        </div>
      )}

      {/* ── Setup checklist (hides itself when everything is done) ── */}
      {setupLoading ? <SetupChecklistSkeleton /> : setupStatus && <SetupChecklist status={setupStatus} />}

      {/* Edge case only: checklist hidden (or unavailable) but payouts still aren't set up */}
      {(!setupStatus || setupStatus.completed >= setupStatus.total) && <PayoutReminder payoutAccount={payoutAccount} />}

      {/* ── Orders that need the seller ── */}
      {stats && <AttentionCard stats={stats} />}

      {/* ── Revenue + store link ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
        <div className="min-w-0 md:col-span-3">
          {statsLoading || !stats ? (
            <Skeleton className="h-full min-h-32 rounded-2xl" />
          ) : (
            <div className="h-full rounded-2xl p-6 text-white relative overflow-hidden shadow-lg gradient-primary">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/[0.06]" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/[0.06]" />
              <div className="relative flex items-center justify-between gap-3">
                <div>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1.5">Total earned</p>
                  <p className="text-4xl font-bold font-heading tabular-nums">₦{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center" aria-hidden="true">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <Link
                    href="/dashboard/earnings"
                    className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
                  >
                    View earnings <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="min-w-0 md:col-span-2">
          {bizLoading || !business ? <StoreLinkCardSkeleton /> : <StoreLinkCard slug={business.slug} />}
        </div>
      </div>

      {/* ── Orders at a glance, or an invitation when there are none yet ── */}
      {statsLoading ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : stats && stats.totalOrders > 0 ? (
        <OrdersAtAGlance stats={stats} />
      ) : stats && setupStatus && setupStatus.completed >= setupStatus.total ? (
        <div className="flex flex-col items-center text-center gap-2 bg-white rounded-2xl shadow-card-md px-6 py-8">
          <div className="h-12 w-12 rounded-2xl bg-[#eff4ff] flex items-center justify-center" aria-hidden="true">
            <Share2 className="h-6 w-6 text-[#0058be]" />
          </div>
          <p className="font-semibold text-[#091426]">Share your store link to get your first order</p>
          <p className="text-sm text-[#64748b] max-w-sm leading-relaxed">
            Send it to friends and customers, or post it on WhatsApp and social media. New orders show up here.
          </p>
        </div>
      ) : null}

      {/* ── Recent orders (only once there are some) ── */}
      {(ordersLoading || !!ordersPage?.content?.length) && (
      <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9]">
          <h3 className="font-bold text-sm text-[#091426] font-heading">Recent orders</h3>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#0058be] hover:text-[#091426] transition-colors"
          >
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="p-3">
          {ordersLoading ? (
            <div className="space-y-2.5 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-11" />
              ))}
            </div>
          ) : !ordersPage?.content?.length ? (
            <p className="text-[#64748b] text-sm text-center py-8">Orders appear here as soon as customers check out.</p>
          ) : (
            <div className="space-y-1">
              {ordersPage.content.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#f8f9ff] transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[#0b1c30]">Order #{order.id}</p>
                    <p className="text-xs text-[#64748b]">
                      {order.orderType} · {order.createdAt}
                    </p>
                  </div>
                  <StatusBadge status={order.status} type="order" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
