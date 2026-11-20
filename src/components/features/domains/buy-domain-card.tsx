'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Globe, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { domainsApi } from '@/lib/api/domains';
import { settingsApi } from '@/lib/api/settings';
import { useAuthStore } from '@/stores/auth.store';
import { getApiError } from '@/lib/utils';
import type { DomainSearchResult } from '@/types';
import PurchaseDialog from './purchase-dialog';
import { formatNaira } from './format';

/**
 * "Buy a domain": search a name, see which endings are free and what they cost in naira, then buy one. Where buying
 * is not allowed (`purchasingEnabled` false) the search and prices still work, but Buy is disabled and nothing can be paid for.
 */
export default function BuyDomainCard({ canManage, purchasingEnabled }: { canManage: boolean; purchasingEnabled: boolean }) {
  const user = useAuthStore((s) => s.user);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DomainSearchResult[] | null>(null);
  const [searched, setSearched] = useState('');
  const [buying, setBuying] = useState<DomainSearchResult | null>(null);

  // Used to prefill the owner's details in the purchase form.
  const { data: business } = useQuery({ queryKey: ['business-settings'], queryFn: settingsApi.getSettings, staleTime: 5 * 60_000 });

  const search = useMutation({
    mutationFn: (q: string) => domainsApi.search(q),
    onSuccess: (res) => {
      setResults(res.results);
      setSearched(res.query);
    },
    onError: (error) => toast.error(getApiError(error, 'Could not search for domains. Try again.')),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q && canManage) search.mutate(q);
  };

  return (
    <Card className="sf-rise">
      <CardHeader>
        <CardTitle>Buy a domain</CardTitle>
        <CardDescription>
          {purchasingEnabled
            ? 'Search for the name you want, pay in naira, and we register it and connect it to your store for you. No technical steps.'
            : 'Search for a name to see if it is free and what it would cost. Buying through Shelflyd is not available yet.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={submit} className="space-y-1.5">
          <Label htmlFor="domain-search">Domain name</Label>
          <div className="flex gap-2">
            <Input
              id="domain-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="yourbrand"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={!canManage}
              maxLength={63}
            />
            <Button type="submit" disabled={!canManage || !query.trim() || search.isPending} className="shrink-0 bg-[#091426] text-white hover:bg-[#091426]/90">
              {search.isPending ? <Loader2 className="animate-spin" /> : <Search />}
              Search
            </Button>
          </div>
        </form>

        {results && (
          <div aria-live="polite">
            {results.length === 0 ? (
              <p className="text-sm text-[#64748b]">No results for “{searched}”. Try a different name.</p>
            ) : (
              <>
              {!purchasingEnabled && results.some((r) => r.available) && (
                <p role="note" className="mb-2 rounded-lg bg-[#f8f9ff] px-3 py-2 text-xs text-[#64748b]">
                  Buying domains isn’t available yet. You can still see which names are free and what they cost, or connect a domain you already own.
                </p>
              )}
              <ul className="divide-y divide-[rgba(9,20,38,0.08)] rounded-xl border border-[rgba(9,20,38,0.1)]">
                {results.map((r, i) => (
                  <li key={r.domain} className="sf-rise flex items-center gap-3 px-3 py-2.5" style={{ ['--sf-i' as string]: i }}>
                    <Globe className="h-4 w-4 shrink-0 text-[#94a3b8]" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm font-medium text-[#091426]">{r.domain}</p>
                      {r.available ? (
                        <p className="text-xs text-[#64748b]">
                          {formatNaira(r.priceNgn)} {r.years === 1 ? 'a year' : `for ${r.years} years`}
                        </p>
                      ) : (
                        <p className="text-xs text-[#94a3b8]">Already taken</p>
                      )}
                    </div>
                    {r.available ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={!canManage || !purchasingEnabled}
                        title={purchasingEnabled ? undefined : 'Buying domains isn’t available yet'}
                        onClick={() => {
                          if (purchasingEnabled) setBuying(r);
                        }}
                        className="shrink-0 bg-[#0058be] text-white hover:bg-[#0058be]/90"
                      >
                        Buy
                      </Button>
                    ) : (
                      <span className="shrink-0 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs font-medium text-[#64748b]">Taken</span>
                    )}
                  </li>
                ))}
              </ul>
              </>
            )}
          </div>
        )}
      </CardContent>

      <PurchaseDialog
        result={purchasingEnabled ? buying : null}
        onClose={() => setBuying(null)}
        defaults={{
          firstName: user?.firstName ?? '',
          lastName: user?.lastName ?? '',
          email: user?.email ?? '',
          phone: business?.pickupPhone ?? user?.phone ?? '',
          address: business?.pickupAddressLine ?? '',
          city: business?.pickupCity ?? '',
          state: business?.pickupState ?? '',
        }}
      />
    </Card>
  );
}
