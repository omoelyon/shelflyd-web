'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { domainsApi } from '@/lib/api/domains';
import { getApiError } from '@/lib/utils';
import { DOMAIN_QUERY_KEY } from './use-store-domain';

/** "Use a domain you already own": the seller types it, then follows the DNS steps shown next. */
export default function ConnectDomainCard({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const [hostname, setHostname] = useState('');

  const connect = useMutation({
    mutationFn: () => domainsApi.connect(hostname.trim()),
    onSuccess: (next) => {
      qc.setQueryData(DOMAIN_QUERY_KEY, next);
      setHostname('');
      toast.success('Domain added. Now add the DNS records shown below.');
    },
    onError: (error) => toast.error(getApiError(error, 'Could not add this domain.')),
  });

  return (
    <Card className="sf-rise">
      <CardHeader>
        <CardTitle>Use a domain you already own</CardTitle>
        <CardDescription>
          Already bought a domain somewhere else, like GoDaddy, Namecheap or Cloudflare? Connect it and your store will open at that address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (hostname.trim() && canManage) connect.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="connect-hostname">Your domain</Label>
            <Input
              id="connect-hostname"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              placeholder="shop.yourbrand.com"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={!canManage || connect.isPending}
              maxLength={253}
            />
            <p className="text-xs text-[#64748b]">
              A subdomain like <span className="font-medium">shop.yourbrand.com</span> is the easiest. A main domain like yourbrand.com works too.
            </p>
          </div>
          <Button type="submit" disabled={!canManage || !hostname.trim() || connect.isPending} className="bg-[#091426] text-white hover:bg-[#091426]/90">
            <Link2 />
            {connect.isPending ? 'Adding…' : 'Connect domain'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
