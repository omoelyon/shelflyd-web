'use client';

import { CheckCircle2, Loader2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatNaira } from './format';
import type { DomainPurchaseStatusInfo } from '@/types';

interface Props {
  purchase: DomainPurchaseStatusInfo | undefined;
  /** True while the first answer is still on its way. */
  loading?: boolean;
  /** True when we have waited a minute and it is still not done. */
  slow?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** Closes the card (shown once the purchase has finished one way or the other). */
  onDismiss?: () => void;
}

/** How a domain purchase is going: confirming the payment, registering, done, or failed. Says only what the server says. */
export default function PurchaseStatusView({ purchase, loading, slow, error, onRetry, onDismiss }: Props) {
  const status = purchase?.status;
  const inFlight = !error && (loading || status === 'PENDING_PAYMENT' || status === 'PAID');
  const domain = purchase?.domain;

  return (
    <Card className="sf-scale-in" aria-live="polite">
      <CardContent className="flex items-start gap-3 pt-6">
        {inFlight ? (
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#0058be]" aria-hidden="true" />
        ) : status === 'REGISTERED' ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
        ) : (
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          {error ? (
            <>
              <h2 className="text-sm font-semibold text-[#091426]">We couldn’t check your purchase</h2>
              <p className="text-sm text-[#64748b]">{error}</p>
              {onRetry && (
                <Button type="button" size="sm" variant="outline" onClick={onRetry} className="mt-2">
                  Try again
                </Button>
              )}
            </>
          ) : inFlight ? (
            <>
              <h2 className="text-sm font-semibold text-[#091426]">
                {status === 'PAID' ? `Registering ${domain ?? 'your domain'}…` : 'Confirming your payment…'}
              </h2>
              <p className="text-sm text-[#64748b]">
                {slow
                  ? 'This is taking longer than usual. You can leave this page: the result will show here once it is done.'
                  : 'This usually takes under a minute. Please keep this page open.'}
              </p>
            </>
          ) : status === 'REGISTERED' ? (
            <>
              <h2 className="text-sm font-semibold text-[#091426]">{domain} is yours</h2>
              <p className="text-sm text-[#64748b]">
                {purchase?.message ?? 'We are connecting it to your store now. It can take a few minutes before it opens.'}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-[#091426]">We couldn’t register {domain ?? 'this domain'}</h2>
              <p className="text-sm text-[#64748b]">
                {purchase?.message ?? 'Nothing was added to your store. If you were charged, the payment will be refunded.'}
              </p>
            </>
          )}
          {purchase && !inFlight && !error && (
            <p className="text-xs text-[#94a3b8]">Reference {purchase.reference} · {formatNaira(purchase.amountNgn)}</p>
          )}
        </div>
        {onDismiss && !inFlight && (
          <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
            Done
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
