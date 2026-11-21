'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { documentsApi } from '@/lib/api/documents';
import { getApiError } from '@/lib/utils';
import PageHeader from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import InvoicingForm from '@/components/features/documents/invoicing-form';

/** The details printed on every receipt, invoice and delivery note: registered name, TIN, address, VAT and a footer note. */
export default function InvoicingSettingsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invoicing-settings'],
    queryFn: documentsApi.getInvoicing,
  });

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] transition-colors hover:text-[#091426]">
        <ArrowLeft className="h-4 w-4" />
        Settings
      </Link>
      <PageHeader
        title="Invoicing & tax"
        subtitle="These details appear on the receipts, invoices and delivery notes you and your buyers download."
      />

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Skeleton className="h-[560px] rounded-2xl" />
          <Skeleton className="h-[420px] rounded-2xl" />
        </div>
      ) : error || !data ? (
        <div role="alert" className="rounded-2xl bg-white p-8 text-center shadow-card-md">
          <p className="text-sm text-[#091426]">{getApiError(error, 'We could not load your invoicing details.')}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <InvoicingForm initial={data} />
      )}
    </div>
  );
}
