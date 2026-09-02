'use client';

import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { ordersApi } from '@/lib/api/orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, ShoppingBag, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const statusColor: Record<string, string> = {
  CREATED:   'bg-slate-100 text-slate-700',
  PAID:      'bg-blue-100 text-blue-700',
  PREPARING: 'bg-amber-100 text-amber-700',
  DELIVERED: 'bg-green-100 text-green-700',
  PICKED_UP: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function AccountPage() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.me,
  });

  const { data: ordersPage, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-customer-orders'],
    queryFn: () => ordersApi.getMyCustomerOrders(0, 5),
  });

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
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : !ordersPage?.content?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No orders yet. Start shopping!
            </p>
          ) : (
            <div className="divide-y divide-border">
              {ordersPage.content.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-1 px-1 rounded transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">Order #{order.id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.orderType ?? 'Standard'}
                    </p>
                  </div>
                  <Badge
                    className={`text-xs font-medium border-0 ${statusColor[order.status] ?? 'bg-slate-100 text-slate-700'}`}
                  >
                    {order.status.replace('_', ' ')}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
