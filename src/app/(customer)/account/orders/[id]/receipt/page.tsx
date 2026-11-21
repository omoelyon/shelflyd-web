'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { documentsApi } from '@/lib/api/documents';
import { getApiError } from '@/lib/utils';
import PrintableDocument from '@/components/features/documents/printable-document';
import { DocumentError, DocumentSkeleton } from '@/components/features/documents/document-states';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** The buyer's receipt for an order they placed: view it, print it, or save it as a PDF. */
export default function BuyerReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const orderId = Number(id);

  const { data: doc, isLoading, error } = useQuery({
    queryKey: ['document', 'buyer-receipt', orderId],
    queryFn: () => documentsApi.getBuyerReceipt(orderId),
    enabled: Number.isFinite(orderId),
    retry: false,
  });

  const back = (
    <Link href={`/account/orders/${orderId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <ChevronLeft className="h-4 w-4" />
      Order #{orderId}
    </Link>
  );

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8">
      {isLoading ? (
        <DocumentSkeleton />
      ) : error || !doc ? (
        <DocumentError message={getApiError(error, 'We could not open this receipt.')}>
          <Link href={`/account/orders/${orderId}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Back to the order
          </Link>
        </DocumentError>
      ) : (
        <PrintableDocument doc={doc} toolbar={back} />
      )}
    </div>
  );
}
