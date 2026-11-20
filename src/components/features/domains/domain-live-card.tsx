'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CheckCircle2, ExternalLink, Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { domainsApi } from '@/lib/api/domains';
import { getApiError } from '@/lib/utils';
import type { CustomDomain } from '@/types';
import { DOMAIN_QUERY_KEY } from './use-store-domain';

/** A domain that is live: the store's address, HTTPS, when a bought domain expires, and (for a connected one) remove. */
export default function DomainLiveCard({ domain, canManage, automaticHttps }: { domain: CustomDomain; canManage: boolean; automaticHttps: boolean }) {
  const qc = useQueryClient();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const url = `https://${domain.hostname}`;

  const remove = useMutation({
    mutationFn: domainsApi.remove,
    onSuccess: (next) => {
      qc.setQueryData(DOMAIN_QUERY_KEY, next);
      setConfirmRemove(false);
      toast.success('Domain removed. Your store is back at its Shelflyd address.');
    },
    onError: (error) => toast.error(getApiError(error, 'Could not remove this domain.')),
  });

  return (
    <Card className="sf-scale-in">
      <CardHeader>
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-semibold">Your store is live on your own domain</span>
        </div>
        <CardTitle className="break-all text-xl">
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:underline">
            {domain.hostname}
            <ExternalLink className="h-4 w-4 shrink-0 text-[#64748b]" aria-hidden="true" />
          </a>
        </CardTitle>
        <CardDescription>Shoppers who open this address land on your store. Links you share will use it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-[#091426]">
          {automaticHttps && (
            <li className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              HTTPS is on, so the padlock shows in the browser.
            </li>
          )}
          {domain.source === 'PURCHASED' && domain.expiresAt && (
            <li className="text-[#64748b]">Registered through Shelflyd until {format(new Date(domain.expiresAt), 'd MMMM yyyy')}.</li>
          )}
          {domain.source === 'CONNECTED' && (
            <li className="text-[#64748b]">This domain stays with you. Keep your DNS records in place so the store keeps loading.</li>
          )}
        </ul>

        {canManage && domain.source === 'CONNECTED' && (
          <Button type="button" variant="outline" onClick={() => setConfirmRemove(true)} className="text-destructive hover:text-destructive">
            <Trash2 />
            Remove domain
          </Button>
        )}
        {domain.source === 'PURCHASED' && (
          <p className="text-xs text-[#64748b]">This domain was bought through Shelflyd. To change or move it, contact support.</p>
        )}
      </CardContent>

      <Dialog open={confirmRemove} onOpenChange={(open) => !remove.isPending && setConfirmRemove(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove {domain.hostname}?</DialogTitle>
            <DialogDescription>
              Shoppers will no longer reach your store at this address, and your store goes back to its Shelflyd address. The domain itself is not touched.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmRemove(false)} disabled={remove.isPending}>
              Keep domain
            </Button>
            <Button type="button" variant="destructive" onClick={() => remove.mutate()} disabled={remove.isPending}>
              {remove.isPending ? 'Removing…' : 'Remove domain'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
