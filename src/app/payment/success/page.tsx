'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { paymentsApi } from '@/lib/api/payments';
import { businessesApi } from '@/lib/api/businesses';

function SuccessContent() {
  const params = useSearchParams();
  const ref = params.get('ref') ?? params.get('reference') ?? '—';

  const { data: payment } = useQuery({
    queryKey: ['payment-reference', ref],
    queryFn: () => paymentsApi.getByReference(ref),
    enabled: ref !== '—',
    retry: false,
  });

  const { data: business } = useQuery({
    queryKey: ['business', payment?.businessId],
    queryFn: () => businessesApi.getById(payment!.businessId),
    enabled: !!payment,
    retry: false,
  });

  const continueShoppingHref = business ? `/businesses/${business.uuid}` : '/products';

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-10 pb-8 space-y-5">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Payment Successful!</h1>
            <p className="text-muted-foreground mt-1">
              Your order has been placed and payment received.
            </p>
          </div>
          <div className="bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground font-mono">
            Reference: {ref}
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Link href={continueShoppingHref} className={cn(buttonVariants(), 'bg-primary text-primary-foreground hover:opacity-90')}>
              Continue Shopping
            </Link>
            <Link href="/" className={cn(buttonVariants({ variant: 'outline' }))}>
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
