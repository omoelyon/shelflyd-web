'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { paymentsApi } from '@/lib/api/payments';
import { businessesApi } from '@/lib/api/businesses';

function SuccessContent() {
  const params = useSearchParams();
  const ref = params.get('ref') ?? params.get('reference') ?? '—';
  const hasRef = ref !== '—';

  // Landing here only means Paystack redirected the browser back — it does not confirm the
  // payment actually went through, nor that the webhook that advances the order has run.
  // Re-checking with the gateway closes that gap (a no-op if the webhook already did its job),
  // and the payment's status afterwards decides what we tell the buyer.
  const { data: payment, isFetching, refetch } = useQuery({
    queryKey: ['payment-reference', ref],
    queryFn: async () => {
      await paymentsApi.resync(ref).catch(() => {});
      return paymentsApi.getByReference(ref);
    },
    enabled: hasRef,
    retry: false,
  });

  const { data: business } = useQuery({
    queryKey: ['business', payment?.businessId],
    queryFn: () => businessesApi.getById(payment!.businessId),
    enabled: !!payment,
    retry: false,
  });

  const continueShoppingHref = business ? `/businesses/${business.uuid}` : '/products';
  const status = payment?.status ?? 'pending';

  const referenceBox = (
    <div className="bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground font-mono">
      Reference: {ref}
    </div>
  );

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-8 space-y-5">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Payment didn&apos;t go through</h1>
              <p className="text-muted-foreground mt-1">
                Your order was not placed. Your cart is still saved, so you can try again.
              </p>
            </div>
            {referenceBox}
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/cart" className={cn(buttonVariants(), 'bg-primary text-primary-foreground hover:opacity-90')}>
                Back to Cart
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

  if (status !== 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-8 space-y-5">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-10 w-10 text-amber-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">We&apos;re confirming your payment</h1>
              <p className="text-muted-foreground mt-1">
                We haven&apos;t received confirmation from your bank yet. You&apos;ll get an email as soon as it&apos;s confirmed.
              </p>
            </div>
            {hasRef && referenceBox}
            <div className="flex flex-col gap-3 pt-2">
              {hasRef && (
                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className={cn(buttonVariants(), 'bg-primary text-primary-foreground hover:opacity-90')}
                >
                  {isFetching ? 'Checking…' : 'Check again'}
                </button>
              )}
              <Link href="/" className={cn(buttonVariants({ variant: 'outline' }))}>
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          {referenceBox}
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
