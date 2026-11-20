'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Globe, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import BuyDomainCard from '@/components/features/domains/buy-domain-card';
import ConnectDomainCard from '@/components/features/domains/connect-domain-card';
import DomainLiveCard from '@/components/features/domains/domain-live-card';
import DomainSetupCard from '@/components/features/domains/domain-setup-card';
import PurchaseProgress from '@/components/features/domains/purchase-progress';
import PurchaseStatusView from '@/components/features/domains/purchase-status-view';
import { useDomainState } from '@/components/features/domains/use-store-domain';
import { getApiError } from '@/lib/utils';

function DomainPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  // Paystack sends the seller back here with ?reference=…; keep it in state and clean the address bar.
  const [reference, setReference] = useState<string | null>(() => params.get('reference'));
  const [dismissedPurchase, setDismissedPurchase] = useState<string | null>(null);
  const { data: state, isLoading, isError, error } = useDomainState();

  useEffect(() => {
    if (reference) router.replace('/dashboard/settings/domain', { scroll: false });
  }, [reference, router]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError || !state) {
    return (
      <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {getApiError(error, 'Could not load your domain settings.')}
      </p>
    );
  }

  if (!state.enabled) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Globe className="h-10 w-10 text-[#cbd5e1]" aria-hidden="true" />
          <p className="text-sm font-medium text-[#091426]">Custom domains aren’t available yet</p>
          <p className="max-w-sm text-sm text-[#64748b]">Your store is open at its Shelflyd address. Your own domain will be possible here soon.</p>
        </CardContent>
      </Card>
    );
  }

  const { domain, canManage } = state;
  const purchase = state.purchase;
  // A purchase still in flight, or one that just failed, is shown even when the seller didn't come straight from payment.
  const showSavedPurchase =
    !reference && purchase && purchase.reference !== dismissedPurchase && (purchase.status === 'PENDING_PAYMENT' || purchase.status === 'PAID' || purchase.status === 'FAILED');

  return (
    <div className="space-y-4">
      {!canManage && (
        <p className="flex items-start gap-2 rounded-xl bg-[#f8f9ff] p-3 text-sm text-[#64748b]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Only the business owner can change the store’s domain. You can see its status here.
        </p>
      )}

      {reference && <PurchaseProgress reference={reference} onDismiss={() => setReference(null)} />}
      {showSavedPurchase && <PurchaseStatusView purchase={purchase} onDismiss={() => setDismissedPurchase(purchase.reference)} />}

      {domain ? (
        domain.status === 'ACTIVE' ? (
          <DomainLiveCard domain={domain} canManage={canManage} automaticHttps={state.automaticHttps} />
        ) : (
          <DomainSetupCard domain={domain} canManage={canManage} automaticHttps={state.automaticHttps} />
        )
      ) : (
        <>
          {state.searchEnabled && <BuyDomainCard canManage={canManage} purchasingEnabled={state.purchasingEnabled} />}
          <ConnectDomainCard canManage={canManage} />
        </>
      )}
    </div>
  );
}

export default function DomainSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#091426]">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Settings
      </Link>
      <PageHeader title="Custom domain" subtitle="Open your store at your own web address, like shop.yourbrand.com." />
      <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
        <DomainPageContent />
      </Suspense>
    </div>
  );
}
