'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BusinessAvatar from '@/components/layout/business-avatar';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import type { BusinessStatus } from '@/types';

const statusColors: Record<BusinessStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

export default function AdminBusinessesPage() {
  const qc = useQueryClient();

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['admin-businesses'],
    queryFn: businessesApi.adminListAll,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: BusinessStatus }) =>
      businessesApi.adminUpdateStatus(id, { status }),
    onSuccess: () => {
      toast.success('Status updated!');
      qc.invalidateQueries({ queryKey: ['admin-businesses'] });
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to update status.')),
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Businesses</h1>
        <p className="text-muted-foreground text-sm">{businesses?.length ?? 0} total businesses</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Businesses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {businesses?.map((business) => (
                <div
                  key={business.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-white"
                >
                  <BusinessAvatar business={business} size={40} className="rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{business.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {business.description || 'No description'}
                    </p>
                  </div>
                  <Badge variant="secondary" className={statusColors[business.status]}>
                    {business.status}
                  </Badge>
                  <div className="flex items-center gap-2 shrink-0">
                    {business.status !== 'ACTIVE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-700 border-green-200 hover:bg-green-50"
                        onClick={() => updateStatus.mutate({ id: business.id, status: 'ACTIVE' })}
                        disabled={updateStatus.isPending}
                      >
                        Approve
                      </Button>
                    )}
                    {business.status !== 'SUSPENDED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-700 border-red-200 hover:bg-red-50"
                        onClick={() => updateStatus.mutate({ id: business.id, status: 'SUSPENDED' })}
                        disabled={updateStatus.isPending}
                      >
                        Suspend
                      </Button>
                    )}
                    {business.status === 'SUSPENDED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-yellow-700 border-yellow-200 hover:bg-yellow-50"
                        onClick={() => updateStatus.mutate({ id: business.id, status: 'PENDING' })}
                        disabled={updateStatus.isPending}
                      >
                        Set Pending
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

