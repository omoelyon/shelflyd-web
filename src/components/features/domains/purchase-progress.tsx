'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { domainsApi } from '@/lib/api/domains';
import { getApiError } from '@/lib/utils';
import PurchaseStatusView from './purchase-status-view';
import { DOMAIN_QUERY_KEY } from './use-store-domain';

const POLL_MS = 3000;
const GIVE_UP_MS = 60_000;

/**
 * Where the seller lands after paying: the first look confirms the payment and registers the domain, then we watch
 * (every 3 seconds, for about a minute) until it is registered or has failed.
 */
export default function PurchaseProgress({ reference, onDismiss }: { reference: string; onDismiss: () => void }) {
  const qc = useQueryClient();
  const confirmed = useRef(false);
  const startedAt = useRef(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    startedAt.current = Date.now();
    const timer = window.setTimeout(() => setSlow(true), GIVE_UP_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const query = useQuery({
    queryKey: ['domain-purchase', reference],
    queryFn: async () => {
      if (!confirmed.current) {
        confirmed.current = true;
        try {
          return await domainsApi.completePurchase(reference);
        } catch (err) {
          confirmed.current = false;   // try the confirmation again next time
          throw err;
        }
      }
      return domainsApi.getPurchase(reference);
    },
    retry: false,
    staleTime: 0,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      const working = !status || status === 'PENDING_PAYMENT' || status === 'PAID';
      return working && Date.now() - startedAt.current < GIVE_UP_MS ? POLL_MS : false;
    },
  });

  const status = query.data?.status;
  useEffect(() => {
    // Once it has settled, the domain page's own state (the new domain, or the failure) needs a fresh look.
    if (status === 'REGISTERED' || status === 'FAILED') {
      qc.invalidateQueries({ queryKey: DOMAIN_QUERY_KEY });
    }
  }, [status, qc]);

  return (
    <PurchaseStatusView
      purchase={query.data}
      loading={query.isLoading}
      slow={slow}
      error={query.isError ? getApiError(query.error, 'Please try again in a moment.') : null}
      onRetry={() => query.refetch()}
      onDismiss={onDismiss}
    />
  );
}
