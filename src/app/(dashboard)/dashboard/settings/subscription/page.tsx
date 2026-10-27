'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/lib/api/subscription';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/ui/page-header';
import { toast } from 'sonner';
import { cn, getApiError } from '@/lib/utils';
import { CalendarClock, CreditCard, Receipt } from 'lucide-react';
import type { Subscription, SubscriptionCharge, SubscriptionState } from '@/types';

const stateStyle: Record<SubscriptionState, { label: string; className: string }> = {
  TRIAL: { label: 'Free trial', className: 'bg-blue-100 text-blue-700' },
  ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700' },
  GRACE: { label: 'Grace period', className: 'bg-amber-100 text-amber-800' },
  LAPSED: { label: 'Expired', className: 'bg-red-100 text-red-700' },
};

const chargeStatusStyle: Record<SubscriptionCharge['status'], string> = {
  SUCCESS: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-800',
  FAILED: 'bg-red-100 text-red-700',
};

const naira = (n: number) => `₦${n.toLocaleString()}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function keyDate(sub: Subscription): string {
  switch (sub.state) {
    case 'TRIAL':
      return `Trial ends ${formatDate(sub.trialEndsAt)}`;
    case 'ACTIVE':
      return sub.autoRenew
        ? `Renews ${formatDate(sub.accessEndsAt)}`
        : `Paid until ${formatDate(sub.accessEndsAt)}`;
    case 'GRACE':
      return `Storefront will be hidden on ${formatDate(sub.graceEndsAt)}`;
    default:
      return 'Your storefront is hidden';
  }
}

function SubscriptionContent() {
  const qc = useQueryClient();
  const router = useRouter();
  const params = useSearchParams();
  const reference = params.get('reference') ?? params.get('trxref');
  const verified = useRef<string | null>(null);

  const { data: sub, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionApi.get,
    retry: false,
  });

  // Coming back from Paystack: confirm the payment once, report the outcome, then drop the param.
  const verifyMutation = useMutation({
    mutationFn: (ref: string) => subscriptionApi.verify(ref),
    onSuccess: (updated) => {
      qc.setQueryData(['subscription'], updated);
      toast.success('Payment confirmed — thank you!');
    },
    onError: (error) => toast.error(getApiError(error, 'We could not confirm that payment yet. It will update shortly.')),
    onSettled: () => router.replace('/dashboard/settings/subscription'),
  });

  useEffect(() => {
    if (reference && verified.current !== reference) {
      verified.current = reference;
      verifyMutation.mutate(reference);
    }
  }, [reference, verifyMutation]);

  const payMutation = useMutation({
    mutationFn: async () => {
      const { url } = await subscriptionApi.pay();
      window.location.href = url;
    },
    onError: (error) => toast.error(getApiError(error, 'Could not start the payment. Please try again.')),
  });

  const cardMutation = useMutation({
    mutationFn: async () => {
      const { url } = await subscriptionApi.addCard();
      window.location.href = url;
    },
    onError: (error) => toast.error(getApiError(error, 'Could not start card setup. Please try again.')),
  });

  const autoRenewMutation = useMutation({
    mutationFn: (enabled: boolean) => subscriptionApi.setAutoRenew(enabled),
    onSuccess: (updated) => {
      qc.setQueryData(['subscription'], updated);
      toast.success(updated.autoRenew ? 'Automatic renewal turned on' : 'Automatic renewal turned off');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to update automatic renewal.')),
  });

  const removeCardMutation = useMutation({
    mutationFn: subscriptionApi.removeCard,
    onSuccess: (updated) => {
      qc.setQueryData(['subscription'], updated);
      toast.success('Card removed');
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to remove card.')),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  // Not the owner, or the request failed — nothing useful to show.
  if (!sub) {
    return (
      <p className="text-sm text-muted-foreground">
        Subscription details are only available to the business owner.
      </p>
    );
  }

  const style = stateStyle[sub.state];
  const paying = payMutation.isPending || verifyMutation.isPending;
  const payLabel =
    sub.state === 'TRIAL' || sub.state === 'ACTIVE'
      ? `Pay now / Extend one month (${naira(sub.priceNaira)})`
      : `Pay ${naira(sub.priceNaira)} for a month`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Your plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', style.className)}>
              {style.label}
            </span>
            <span className="text-sm font-medium">{keyDate(sub)}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {naira(sub.priceNaira)} per month. Your first month is free.
            {(sub.state === 'TRIAL' || sub.state === 'ACTIVE' || sub.state === 'GRACE') && sub.daysLeft > 0
              ? ` ${sub.daysLeft} day${sub.daysLeft === 1 ? '' : 's'} left.`
              : ''}
          </p>
          <Button
            className="bg-[#091426] text-white hover:bg-[#091426]/90"
            disabled={paying}
            onClick={() => payMutation.mutate()}
          >
            {payMutation.isPending ? 'Redirecting…' : payLabel}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sub.card ? (
            <>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
                <p className="text-sm font-medium">
                  {sub.card.brand ?? 'Card'} •••• {sub.card.last4 ?? '••••'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={removeCardMutation.isPending}
                  onClick={() => removeCardMutation.mutate()}
                >
                  {removeCardMutation.isPending ? 'Removing…' : 'Remove card'}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Automatic renewal</p>
                  <p className="text-xs text-muted-foreground">
                    {sub.autoRenew
                      ? 'We charge this card each month when your plan ends.'
                      : 'Turned off — you will need to pay each month yourself.'}
                  </p>
                </div>
                <Switch
                  aria-label="Automatic renewal"
                  checked={sub.autoRenew}
                  disabled={autoRenewMutation.isPending}
                  onCheckedChange={(checked) => autoRenewMutation.mutate(checked)}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Add a card and we&apos;ll renew your plan automatically. We&apos;ll charge{' '}
                {naira(sub.cardSetupAmountNaira)} to verify your card and refund it; your first charge happens when your
                trial ends.
              </p>
              <Button variant="outline" disabled={cardMutation.isPending} onClick={() => cardMutation.mutate()}>
                {cardMutation.isPending ? 'Redirecting…' : 'Add card for automatic renewal'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Charges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sub.charges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No charges yet — your free month is on us.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sub.charges.map((c) => (
                  <TableRow key={c.reference}>
                    <TableCell className="whitespace-nowrap">{formatDate(c.createdAt)}</TableCell>
                    <TableCell>{c.kind === 'CARD_SETUP' ? 'Card verification (refunded)' : 'Monthly subscription'}</TableCell>
                    <TableCell className="text-right tabular-nums">{naira(c.amountNaira)}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', chargeStatusStyle[c.status])}>
                        {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Subscription"
        subtitle="Your Shelflyd plan keeps your storefront live. Pay each month, or add a card to renew automatically."
      />
      <Suspense fallback={<Skeleton className="h-40 rounded-xl" />}>
        <SubscriptionContent />
      </Suspense>
    </div>
  );
}
