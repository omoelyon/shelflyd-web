'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { businessesApi } from '@/lib/api/businesses';
import { useThemeStore } from '@/stores/theme.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  Truck,
  Store,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
        { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600' },
        { label: 'Paid Orders', value: stats.paidOrders, icon: CreditCard, color: 'text-green-600' },
        { label: 'Preparing', value: stats.preparingOrders, icon: Package, color: 'text-orange-600' },
        { label: 'Delivered', value: stats.deliveredOrders, icon: CheckCircle, color: 'text-primary' },
        { label: 'Pending', value: stats.createdOrders, icon: Clock, color: 'text-yellow-600' },
        { label: 'Out for Delivery', value: stats.pickedUpOrders, icon: Truck, color: 'text-cyan-600' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Business header */}
      {bizLoading ? (
        <Skeleton className="h-20 rounded-xl" />
      ) : business ? (
        <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-border">
          <div
            className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: business.themeColor ?? '#16a34a' }}
          >
            {business.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{business.name}</h1>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={
                  business.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : business.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                {business.status}
              </Badge>
              {business.status === 'PENDING' && (
                <span className="text-xs text-muted-foreground">
                  Awaiting admin approval
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" className="ml-auto" asChild>
            <Link href="/dashboard/settings">
              <Store className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      ) : (
        <div className="p-5 bg-white rounded-xl border border-border text-center">
          <p className="text-muted-foreground mb-3">You haven&apos;t registered a business yet.</p>
          <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
            <Link href="/dashboard/register-business">Register Business</Link>
          </Button>
        </div>
      )}

      {/* Revenue */}
      {stats && (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-primary">
                  ₦{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <Icon className={`h-6 w-6 ${color}`} />
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/orders">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : ordersPage?.content?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {ordersPage?.content.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">Order #{order.id}</p>
                    <p className="text-xs text-muted-foreground">{order.orderType} · {order.createdAt}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    CREATED: 'bg-gray-100 text-gray-700',
    PAID: 'bg-blue-100 text-blue-700',
    PREPARING: 'bg-orange-100 text-orange-700',
    READY_FOR_PICKUP: 'bg-indigo-100 text-indigo-700',
    READY_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
    OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-700',
    DELIVERED: 'bg-green-100 text-green-700',
    PICKED_UP: 'bg-green-100 text-green-700',
  };
  return (
    <Badge variant="secondary" className={config[status] ?? 'bg-gray-100 text-gray-700'}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
