'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { storefrontApi } from '@/lib/api/storefront';
import SectionList from '@/components/storefront/section-renderer';
import StorefrontShell from '@/components/storefront/shell';
import { StorefrontProvider, useStorefront } from '@/components/storefront/storefront-context';
import { isPreviewMessage } from '@/components/features/storefront-editor/preview-protocol';
import { Skeleton } from '@/components/ui/skeleton';

function PreviewBody() {
  const { design } = useStorefront();
  return (
    <StorefrontShell totalItems={0} isAuthenticated={false}>
      <div className="pb-10">
        <SectionList sections={design.pages.home.sections} />
      </div>
    </StorefrontShell>
  );
}

function PreviewPage() {
  const slug = useSearchParams().get('slug') ?? '';
  // The working design arrives from the editor that embeds this page; until then there is nothing to show.
  const [design, setDesign] = useState<unknown>(null);

  const { data: info, isLoading } = useQuery({
    queryKey: ['storefront', slug],
    queryFn: () => storefrontApi.getInfo(slug),
    enabled: !!slug,
  });

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      if (isPreviewMessage(e.data) && e.data.type === 'sf-design') setDesign(e.data.design);
    };
    window.addEventListener('message', onMessage);
    // Ask the editor for the current design (it also pushes on its own whenever something changes).
    if (window.parent !== window) window.parent.postMessage({ type: 'sf-ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!slug) {
    return <p className="p-6 text-sm text-muted-foreground">Open this preview from the storefront editor.</p>;
  }
  if (design === null) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }
  return (
    <StorefrontProvider slug={slug} info={info} isLoading={isLoading} designOverride={design} preview>
      <PreviewBody />
    </StorefrontProvider>
  );
}

/** What the editor's iframe shows: the storefront home page rendered from a design sent by the editor (never saved here). */
export default function StorefrontPreviewPage() {
  return (
    <Suspense fallback={null}>
      <PreviewPage />
    </Suspense>
  );
}
