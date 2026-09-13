'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api/orders';
import { Skeleton } from '@/components/ui/skeleton';
import BusinessAvatar from '@/components/layout/business-avatar';
import { Store, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function MyBusinessesPage() {
  const { data: patronized, isLoading } = useQuery({
    queryKey: ['my-patronized-businesses'],
    queryFn: ordersApi.getMyPatronizedBusinesses,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/account" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[#091426]">Businesses You&apos;ve Shopped With</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : !patronized?.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <Store className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No businesses yet</p>
          <p className="text-sm mt-1">Places you order from will show up here.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
            Browse stores
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {patronized.map(({ business, orderCount, lastOrderAt }) => (
            <Link
              key={business.id}
              href={`/storefront/${business.slug}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:bg-slate-50 transition-colors"
            >
              <BusinessAvatar business={business} size={48} className="rounded-xl shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#091426] truncate">{business.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {orderCount} order{orderCount === 1 ? '' : 's'} · last order {new Date(lastOrderAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs font-medium text-primary shrink-0">Visit store →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
