'use client';

import { useQuery } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, CheckCircle, Clock, Ban } from 'lucide-react';

export default function AdminPage() {
  const { data: businesses, isLoading } = useQuery({
    queryKey: ['admin-businesses'],
    queryFn: businessesApi.adminListAll,
  });

  const stats = businesses
    ? {
        total: businesses.length,
        active: businesses.filter((b) => b.status === 'ACTIVE').length,
        pending: businesses.filter((b) => b.status === 'PENDING').length,
        suspended: businesses.filter((b) => b.status === 'SUSPENDED').length,
      }
    : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground text-sm">Admin dashboard for Shelflyd.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Businesses', value: stats?.total ?? 0, icon: Building2, color: 'text-blue-600' },
            { label: 'Active', value: stats?.active ?? 0, icon: CheckCircle, color: 'text-green-600' },
            { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, color: 'text-yellow-600' },
            { label: 'Suspended', value: stats?.suspended ?? 0, icon: Ban, color: 'text-red-600' },
          ].map(({ label, value, icon: Icon, color }) => (
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
    </div>
  );
}
