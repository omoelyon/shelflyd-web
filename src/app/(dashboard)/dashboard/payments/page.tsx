'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard } from 'lucide-react';
import { formatStatus } from '@/lib/utils';
import { format } from 'date-fns';

const gatewayColors: Record<string, string> = {
  paystack: 'bg-blue-100 text-blue-700',
  flutterwave: 'bg-orange-100 text-orange-700',
  stripe: 'bg-purple-100 text-purple-700',
};

export default function DashboardPaymentsPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['business-payments', page],
    queryFn: () => businessesApi.getPayments(page, 15),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {data?.totalElements ?? 0} total transactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : data?.content?.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No payments yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.content.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-white"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{payment.reference}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={gatewayColors[payment.paymentGateway] ?? 'bg-gray-100 text-gray-700'}>
                        {payment.paymentGateway}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {payment.createdAt
                          ? format(new Date(payment.createdAt.replace(' ', 'T')), 'dd MMM yyyy, HH:mm')
                          : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </p>
                    <Badge
                      variant="secondary"
                      className={payment.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                    >
                      {formatStatus(payment.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" disabled={data.first} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pageable.pageNumber + 1} of {data.totalPages}
          </span>
          <Button variant="outline" disabled={data.last} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
