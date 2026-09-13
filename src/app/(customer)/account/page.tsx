'use client';

import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { ordersApi } from '@/lib/api/orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BusinessAvatar from '@/components/layout/business-avatar';
import { useMyBusiness } from '@/hooks/use-my-business';
import { useReorder } from '@/hooks/use-reorder';
import { User, ShoppingBag, ChevronRight, Store, RotateCcw, Sparkles, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import type { Business } from '@/types';

const statusColor: Record<string, string> = {
  CREATED:   'bg-slate-100 text-slate-700',
  PAID:      'bg-blue-100 text-blue-700',
  PREPARING: 'bg-amber-100 text-amber-700',
  DELIVERED: 'bg-green-100 text-green-700',
  PICKED_UP: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function AccountPage() {
  const { hasBusiness, isChecking } = useMyBusiness();
  const reorder = useReorder();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.me,
  });

  const { data: ordersPage, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-customer-orders'],
    queryFn: () => ordersApi.getMyCustomerOrders(0, 5),
  });

  const { data: patronized, isLoading: patronizedLoading } = useQuery({
    queryKey: ['my-patronized-businesses'],
    queryFn: ordersApi.getMyPatronizedBusinesses,
  });

  const businessMap = new Map<number, Business>((patronized ?? []).map((p) => [p.business.id, p.business]));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-[#091426]">My Account</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-40" />
            </div>
          ) : user ? (
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-28">Name:</span>
                <span className="font-medium">{user.firstName} {user.lastName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-28">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28">Phone:</span>
                  <span className="font-medium">{user.phone}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Could not load profile.</p>
          )}
        </CardContent>
      </Card>

      {/* Selling CTA / dashboard shortcut */}
      {!isChecking && (
        <Card className={hasBusiness ? '' : 'border-primary/20 bg-primary/[0.03]'}>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {hasBusiness ? (
                <LayoutDashboard className="h-5 w-5 text-primary" />
              ) : (
                <Sparkles className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[#091426]">
                {hasBusiness ? 'Manage your business' : 'Start selling on Shelflyd'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasBusiness
                  ? 'Jump into your seller dashboard to manage products and orders.'
                  : 'Turn your shopping account into a storefront in minutes.'}
              </p>
            </div>
            <Link
              href={hasBusiness ? '/dashboard' : '/dashboard/register-business'}
              className="text-sm font-medium text-primary hover:underline shrink-0"
            >
              {hasBusiness ? 'Go to dashboard' : 'Get started'}
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Businesses patronized */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4" />
            Businesses You&apos;ve Shopped With
          </CardTitle>
          {!!patronized?.length && (
            <Link
              href="/account/businesses"
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {patronizedLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : !patronized?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              You haven&apos;t ordered from any business yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {patronized.slice(0, 4).map(({ business, orderCount }) => (
                <Link
                  key={business.id}
                  href={`/storefront/${business.slug}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                >
                  <BusinessAvatar business={business} size={36} className="rounded-lg shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{business.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {orderCount} order{orderCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Recent Orders
          </CardTitle>
          <Link
            href="/account/orders"
            className="text-xs text-primary hover:underline flex items-center gap-0.5"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : !ordersPage?.content?.length ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No orders yet. Start shopping!</p>
              <Link href="/" className="mt-2 inline-block text-sm text-primary hover:underline">
                Browse stores
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {ordersPage.content.map((order) => {
                const business = businessMap.get(order.businessId);
                const isReordering = reorder.isPending && reorder.variables === order.id;
                return (
                  <div key={order.id} className="p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      {business ? (
                        <BusinessAvatar business={business} size={40} className="rounded-lg shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
                      )}
                      <Link href={`/account/orders/${order.id}`} className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{business?.name ?? `Order #${order.id}`}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Order #{order.id} · {order.orderType ?? 'Standard'}
                        </p>
                      </Link>
                      <Badge
                        className={`text-xs font-medium border-0 shrink-0 ${statusColor[order.status] ?? 'bg-slate-100 text-slate-700'}`}
                      >
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        disabled={isReordering}
                        onClick={() => reorder.mutate(order.id)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1.5" />
                        {isReordering ? 'Adding…' : 'Reorder'}
                      </Button>
                      {business && (
                        <Link
                          href={`/storefront/${business.slug}`}
                          className="inline-flex items-center justify-center gap-1.5 h-7 px-3 text-xs font-medium rounded-md border border-input hover:bg-accent transition-colors flex-1"
                        >
                          <Store className="h-3 w-3" />
                          Visit store
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
