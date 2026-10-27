'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutApi } from '@/lib/api/payout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/ui/page-header';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Landmark, CheckCircle2 } from 'lucide-react';

export default function PayoutAccountPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [bankFilter, setBankFilter] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState<string | null>(null);

  const { data: account, isLoading } = useQuery({
    queryKey: ['payout-account'],
    queryFn: payoutApi.getAccount,
  });

  const { data: banks } = useQuery({
    queryKey: ['payout-banks'],
    queryFn: payoutApi.listBanks,
    staleTime: 60 * 60 * 1000,
  });

  const showForm = editing || (!!account && !account.configured);

  const visibleBanks = useMemo(() => {
    const term = bankFilter.trim().toLowerCase();
    const all = banks ?? [];
    const filtered = term ? all.filter((b) => b.name.toLowerCase().includes(term)) : all;
    // Keep the picked bank in the list even if the search filter would hide it.
    const picked = all.find((b) => b.code === bankCode);
    return picked && !filtered.includes(picked) ? [picked, ...filtered] : filtered;
  }, [banks, bankFilter, bankCode]);

  const resolveMutation = useMutation({
    mutationFn: () => payoutApi.resolveAccount(bankCode, accountNumber),
    onSuccess: (res) => setResolvedName(res.accountName),
    onError: (error) => {
      setResolvedName(null);
      toast.error(getApiError(error, 'Could not verify this account. Check the bank and account number.'));
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => payoutApi.saveAccount({ bankCode, accountNumber }),
    onSuccess: (saved) => {
      qc.setQueryData(['payout-account'], saved);
      toast.success('Payout account saved!');
      setEditing(false);
      setBankCode('');
      setBankFilter('');
      setAccountNumber('');
      setResolvedName(null);
    },
    onError: (error) => toast.error(getApiError(error, 'Failed to save payout account.')),
  });

  const accountReady = !!bankCode && accountNumber.length === 10;

  const onBankChange = (code: string) => {
    setBankCode(code);
    setResolvedName(null);
  };

  const onAccountNumberChange = (value: string) => {
    setAccountNumber(value.replace(/\D/g, '').slice(0, 10));
    setResolvedName(null);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Payout Account"
        subtitle="Customer payments for your orders are settled to this account automatically."
      />

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <>
          {account?.configured && !editing && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Payout account active
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{account.accountName}</p>
                  <p className="text-muted-foreground">
                    {account.bankName} · {account.accountNumberMasked}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Update
                </Button>
              </CardContent>
            </Card>
          )}

          {showForm && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Landmark className="h-4 w-4" />
                  {account?.configured ? 'Update payout account' : 'Add your payout account'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bank-filter">Bank</Label>
                  <Input
                    id="bank-filter"
                    placeholder="Search for your bank…"
                    value={bankFilter}
                    onChange={(e) => setBankFilter(e.target.value)}
                  />
                  <select
                    aria-label="Bank"
                    value={bankCode}
                    onChange={(e) => onBankChange(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">{banks ? 'Select a bank' : 'Loading banks…'}</option>
                    {visibleBanks.map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="account-number">Account number</Label>
                  <Input
                    id="account-number"
                    inputMode="numeric"
                    placeholder="10-digit account number"
                    value={accountNumber}
                    onChange={(e) => onAccountNumberChange(e.target.value)}
                  />
                </div>

                {resolvedName && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      Account name: <span className="font-semibold">{resolvedName}</span>
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!accountReady || resolveMutation.isPending}
                    onClick={() => resolveMutation.mutate()}
                  >
                    {resolveMutation.isPending ? 'Verifying…' : 'Verify account'}
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#091426] text-white hover:bg-[#091426]/90"
                    disabled={!accountReady || !resolvedName || saveMutation.isPending}
                    onClick={() => saveMutation.mutate()}
                  >
                    {saveMutation.isPending ? 'Saving…' : 'Save payout account'}
                  </Button>
                  {account?.configured && (
                    <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Verify the account name matches your business before saving — payouts go to this account.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
