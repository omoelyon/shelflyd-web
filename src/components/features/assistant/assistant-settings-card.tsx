'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { assistantApi } from '@/lib/api/assistant';
import { getApiError } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

/**
 * The store's AI shopping assistant: on or off for shoppers, and the AI credit it runs on. Shown only while Shelflyd
 * has the assistant switched on.
 */
export default function AssistantSettingsCard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['assistant-settings'], queryFn: assistantApi.settings, retry: false, meta: { silentError: true } });
  const save = useMutation({
    mutationFn: assistantApi.saveSettings,
    onSuccess: (next) => {
      qc.setQueryData(['assistant-settings'], next);
      toast.success(next.enabled ? 'Shoppers can now chat with your assistant.' : 'The shopping assistant is off.');
    },
    onError: (error) => toast.error(getApiError(error, 'Could not change this.')),
  });

  if (!data?.available) return null;
  const outOfCredit = data.billingEnforced && data.balance <= 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#0058be]" aria-hidden="true" />
            Shopping assistant
          </CardTitle>
          <CardDescription>
            An AI assistant on your store that helps shoppers find products, puts their order together and takes them to
            payment. It only talks about your store and shopping on Shelflyd.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[rgba(9,20,38,0.1)] bg-[#f8f9ff] p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#091426]">Show the assistant on my store</p>
              <p className="text-xs text-[#64748b]">Shoppers see an “Ask” button in the corner of your store.</p>
            </div>
            <Switch
              checked={data.enabled}
              disabled={save.isPending}
              onCheckedChange={(on) => save.mutate(on)}
              aria-label="Show the shopping assistant on my store"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-[#64748b]">
              AI credit <span className="ml-1 font-semibold tabular-nums text-[#091426]">{formatMoney(data.balance)}</span>
            </span>
            <Link href="/dashboard/settings/ai" className="inline-flex items-center gap-1 text-xs font-semibold text-[#0058be] hover:underline">
              {outOfCredit ? 'Buy credit' : 'Usage and credit'} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className={outOfCredit ? 'text-xs font-medium text-amber-700' : 'text-xs text-[#64748b]'}>
            {outOfCredit
              ? 'You have no AI credit, so the assistant is off for now. Buy credit to switch it on; your store works as usual meanwhile.'
              : 'AI is billed separately from your Shelflyd plan. Each reply uses a little credit; when it runs out, the assistant pauses and your store works as usual.'}
            {data.monthlyFree > 0 && ` You also get ${formatMoney(data.monthlyFree)} free each month.`}
          </p>
        </CardContent>
      </Card>
      <Separator />
    </>
  );
}
