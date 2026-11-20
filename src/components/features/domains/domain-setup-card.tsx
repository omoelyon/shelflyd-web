'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, CircleDashed, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { domainsApi } from '@/lib/api/domains';
import { cn, getApiError } from '@/lib/utils';
import type { CustomDomain } from '@/types';
import DnsRecordRow from './dns-record-row';
import { DOMAIN_QUERY_KEY } from './use-store-domain';

function StepHeading({ done, current, title, children }: { done: boolean; current: boolean; title: string; children?: React.ReactNode }) {
  const Icon = done ? CheckCircle2 : CircleDashed;
  return (
    <div className="flex items-start gap-3">
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', done ? 'text-emerald-600' : current ? 'text-[#0058be]' : 'text-[#94a3b8]')} aria-hidden="true" />
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-[#091426]">
          {title}
          {done && <span className="ml-2 text-xs font-medium text-emerald-700">Done</span>}
        </h3>
        {children}
      </div>
    </div>
  );
}

/** A domain that is not live yet: the DNS records to add, what is still missing, and "Check now". */
export default function DomainSetupCard({ domain, canManage, automaticHttps }: { domain: CustomDomain; canManage: boolean; automaticHttps: boolean }) {
  const qc = useQueryClient();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const purchased = domain.source === 'PURCHASED';
  const proven = domain.verification === null;

  const check = useMutation({
    mutationFn: domainsApi.check,
    onSuccess: (next) => {
      qc.setQueryData(DOMAIN_QUERY_KEY, next);
      if (next.domain?.status === 'ACTIVE') toast.success('Your domain is live!');
      else toast.info('Checked. It is not ready yet.');
    },
    onError: (error) => toast.error(getApiError(error, 'Could not check your domain.')),
  });

  const remove = useMutation({
    mutationFn: domainsApi.remove,
    onSuccess: (next) => {
      qc.setQueryData(DOMAIN_QUERY_KEY, next);
      setConfirmRemove(false);
      toast.success('Domain removed.');
    },
    onError: (error) => toast.error(getApiError(error, 'Could not remove this domain.')),
  });

  const checkedAgo = domain.lastCheckedAt ? formatDistanceToNow(new Date(domain.lastCheckedAt), { addSuffix: true }) : null;

  return (
    <Card className="sf-rise">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="break-all">{domain.hostname}</CardTitle>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">Setting up</span>
        </div>
        <CardDescription>
          {purchased
            ? 'We are connecting your new domain to your store. This usually takes a few minutes.'
            : 'Add the records below where you manage this domain. We keep checking, and your store goes live at this address once everything matches.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {domain.message && (
          <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {domain.message}
          </p>
        )}

        {!purchased && (
          <ol className="space-y-5">
            <li>
              <StepHeading done={proven} current={!proven} title="Prove the domain is yours">
                {!proven && domain.verification && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-[#64748b]">Add this TXT record. It only confirms ownership and can be deleted once your domain is live.</p>
                    <DnsRecordRow record={domain.verification} />
                  </div>
                )}
              </StepHeading>
            </li>
            <li>
              <StepHeading done={false} current={proven} title="Point the domain at Shelflyd">
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-[#64748b]">
                    Add one of these records. {proven ? '' : 'You can add it at the same time as the first one. '}If your provider already has a record with the same name, change it instead of adding another.
                  </p>
                  {domain.routing.map((record) => (
                    <DnsRecordRow key={`${record.type}-${record.name}`} record={record} />
                  ))}
                </div>
              </StepHeading>
            </li>
          </ol>
        )}

        {!purchased && (
          <details className="group rounded-lg border border-[rgba(9,20,38,0.1)] px-3 py-2 text-sm">
            <summary className="cursor-pointer select-none font-medium text-[#091426] outline-none focus-visible:ring-2 focus-visible:ring-[#0058be]/40">
              How do I add a DNS record?
            </summary>
            <div className="mt-2 space-y-2 text-xs text-[#64748b]">
              <p>
                Sign in to the company where you bought the domain (for example Namecheap, GoDaddy, Cloudflare or Squarespace) and open its <span className="font-medium text-[#091426]">DNS</span> settings. It may be called “Manage DNS”, “DNS records” or “Advanced DNS”.
              </p>
              <p>Add a new record, choose the type shown above, and copy the name and value in. Some providers want only the part before your domain in the name field, for example <span className="font-mono">_shelflyd-verify.shop</span> instead of the full address.</p>
              <p>Changes usually show up within minutes, but can take a few hours. You don’t have to stay on this page: we keep checking {automaticHttps ? 'and set up HTTPS for you' : 'in the background'}.</p>
            </div>
          </details>
        )}

        {purchased && (
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Waiting for the internet to find {domain.hostname}…
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => check.mutate()}
            disabled={check.isPending}
            className="bg-[#091426] text-white hover:bg-[#091426]/90"
          >
            <RefreshCw className={check.isPending ? 'animate-spin' : ''} />
            {check.isPending ? 'Checking…' : 'Check now'}
          </Button>
          {canManage && !purchased && (
            <Button type="button" variant="outline" onClick={() => setConfirmRemove(true)} className="text-destructive hover:text-destructive">
              <Trash2 />
              Remove domain
            </Button>
          )}
          {checkedAgo && <span className="text-xs text-[#64748b]">Last checked {checkedAgo}</span>}
        </div>
      </CardContent>

      <Dialog open={confirmRemove} onOpenChange={(open) => !remove.isPending && setConfirmRemove(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove {domain.hostname}?</DialogTitle>
            <DialogDescription>
              Your store goes back to its Shelflyd address. The domain itself is not touched. You can connect it again later.
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
