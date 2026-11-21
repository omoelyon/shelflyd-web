'use client';

import { Suspense, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { documentsApi } from '@/lib/api/documents';
import { ordersApi } from '@/lib/api/orders';
import { getApiError, cn } from '@/lib/utils';
import PrintableDocument from '@/components/features/documents/printable-document';
import { DocumentError, DocumentSkeleton } from '@/components/features/documents/document-states';
import { SELLER_DOCUMENTS } from '@/components/features/documents/format';
import { buttonVariants } from '@/components/ui/button';
import type { DocumentType } from '@/types/documents';

const TYPES = SELLER_DOCUMENTS.map((d) => d.type);
const parseType = (raw: string | null): DocumentType => (TYPES.includes(raw as DocumentType) ? (raw as DocumentType) : 'receipt');

export default function SellerDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DocumentSkeleton />}>
      <SellerDocument params={params} />
    </Suspense>
  );
}

/** One document for an order of this business, with a switch between receipt, invoice, delivery note and credit note. */
function SellerDocument({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const orderId = Number(id);
  const type = parseType(useSearchParams().get('type'));

  // Shares the cache with the order page. Only used to know whether a credit note can exist (cancelled orders).
  const { data: order } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => ordersApi.getById(orderId),
    enabled: Number.isFinite(orderId),
  });
  const cancelled = order?.status === 'CANCELLED';

  const { data: doc, isLoading, error } = useQuery({
    queryKey: ['document', 'seller', orderId, type],
    queryFn: () => documentsApi.getSellerDocument(orderId, type),
    enabled: Number.isFinite(orderId),
    retry: false,
  });

  const tabs = SELLER_DOCUMENTS.filter((d) => d.type !== 'credit-note' || cancelled || type === 'credit-note');

  const toolbar = (
    <>
      <Link href={`/dashboard/orders/${orderId}`} className="mr-1 inline-flex items-center gap-1 text-sm text-[#64748b] transition-colors hover:text-[#091426]">
        <ArrowLeft className="h-4 w-4" />
        Order #{orderId}
      </Link>
      <nav aria-label="Document type" className="flex flex-wrap gap-1 rounded-xl bg-[#f8f9ff] p-1">
        {tabs.map((d) => (
          <Link
            key={d.type}
            href={`/dashboard/orders/${orderId}/document?type=${d.type}`}
            aria-current={d.type === type ? 'page' : undefined}
            title={d.hint}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              d.type === type ? 'bg-[#091426] text-white shadow-sm' : 'text-[#64748b] hover:text-[#091426]',
            )}
          >
            {d.label}
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <div className="max-w-[900px]">
      {isLoading ? (
        <DocumentSkeleton />
      ) : error || !doc ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">{toolbar}</div>
          <DocumentError message={getApiError(error, 'We could not open this document.')}>
            <Link href={`/dashboard/orders/${orderId}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Back to the order
            </Link>
          </DocumentError>
        </>
      ) : (
        <PrintableDocument doc={doc} toolbar={toolbar} />
      )}
    </div>
  );
}
