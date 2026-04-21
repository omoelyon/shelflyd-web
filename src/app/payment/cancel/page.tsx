'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

function CancelContent() {
  const params = useSearchParams();
  const ref = params.get('ref') ?? params.get('reference') ?? '—';

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
            <h1 className="text-2xl font-bold">Payment Cancelled</h1>
            <p className="text-muted-foreground mt-1">
              Your payment was not completed. Your cart is still saved.
            </p>
          </div>
          {ref !== '—' && (
            <div className="bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground font-mono">
              Reference: {ref}
            </div>
          )}
          <div className="flex flex-col gap-3 pt-2">
            <Link href="/cart" className={cn(buttonVariants(), 'bg-primary text-primary-foreground hover:opacity-90')}>
              Back to Cart
            </Link>
            <Link href="/products" className={cn(buttonVariants({ variant: 'outline' }))}>
              Browse Products
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense>
      <CancelContent />
    </Suspense>
  );
}
