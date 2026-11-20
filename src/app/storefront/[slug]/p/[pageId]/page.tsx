'use client';

import { use } from 'react';
import { ArrowLeft } from 'lucide-react';
import SectionList from '@/components/storefront/section-renderer';
import { SfLink } from '@/components/storefront/sf-link';
import { useStorefront } from '@/components/storefront/storefront-context';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  params: Promise<{ slug: string; pageId: string }>;
}

/** An extra page the seller added (About, Delivery…): whatever sections its design lists. Only published pages exist for shoppers. */
export default function StorefrontCustomPage({ params }: Props) {
  const { slug, pageId } = use(params);
  const { design, isLoading } = useStorefront();
  const page = design.pages.custom.find((p) => p.id === pageId);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">This page doesn’t exist, or it hasn’t been published yet.</p>
        <SfLink href={`/storefront/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to the store
        </SfLink>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <SectionList sections={page.sections} />
    </div>
  );
}
