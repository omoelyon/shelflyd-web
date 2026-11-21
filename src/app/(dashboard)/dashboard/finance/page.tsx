'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpensesTab from '@/components/features/finance/expenses-tab';
import ProfitLossTab from '@/components/features/finance/profit-loss-tab';
import ReportsTab from '@/components/features/finance/reports-tab';

type TabKey = 'profit-loss' | 'expenses' | 'reports';
const TAB_KEYS: TabKey[] = ['profit-loss', 'expenses', 'reports'];

function FinanceContent() {
  // A link such as /dashboard/finance?tab=expenses opens that tab.
  const requested = useSearchParams().get('tab');
  const [tab, setTab] = useState<TabKey>(TAB_KEYS.includes(requested as TabKey) ? (requested as TabKey) : 'profit-loss');

  return (
    <div className="space-y-6">
      <PageHeader title="Finance" subtitle="Your profit, what you spend, and records for your accountant" />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="gap-5">
        <TabsList className="h-10 max-w-full">
          <TabsTrigger value="profit-loss" className="px-3">
            Profit &amp; loss
          </TabsTrigger>
          <TabsTrigger value="expenses" className="px-3">
            Expenses
          </TabsTrigger>
          <TabsTrigger value="reports" className="px-3">
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss" className="text-base">
          <ProfitLossTab onOpenExpenses={() => setTab('expenses')} />
        </TabsContent>
        <TabsContent value="expenses" className="text-base">
          <ExpensesTab />
        </TabsContent>
        <TabsContent value="reports" className="text-base">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function FinancePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <FinanceContent />
    </Suspense>
  );
}
