'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { storefrontApi } from '@/lib/api/storefront';
import SectionList from '@/components/storefront/section-renderer';
import StorefrontShell from '@/components/storefront/shell';
import { StorefrontProvider, useStorefront } from '@/components/storefront/storefront-context';
import { ProductPagePreview, CartPreview } from '@/components/storefront/previews';
import { isPreviewMessage, type PreviewPage } from '@/components/features/storefront-editor/preview-protocol';
import { Skeleton } from '@/components/ui/skeleton';

function PreviewBody({ page }: { page: PreviewPage }) {
  const { design } = useStorefront();
  let content: React.ReactNode;
  if (page === 'product') {
    content = <ProductPagePreview />;
  } else if (page === 'cart') {
    content = <CartPreview />;
  } else if (page === 'home') {
    content = (
      <div className="pb-10">
        <SectionList sections={design.pages.home.sections} />
      </div>
    );
  } else {
    const custom = design.pages.custom.find((p) => `custom:${p.id}` === page);
    content =
      custom && custom.sections.length > 0 ? (
        <div className="pb-10">
          <SectionList sections={custom.sections} />
        </div>
      ) : (
        <p className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-muted-foreground">
          {custom ? 'This page has no sections yet. Add one in the editor.' : 'This page no longer exists.'}
        </p>
      );
  }
  return (
    <StorefrontShell totalItems={0} isAuthenticated={false}>
      {content}
    </StorefrontShell>
  );
}

function PreviewPage() {
  const slug = useSearchParams().get('slug') ?? '';
  // The working design arrives from the editor that embeds this page; until then there is nothing to show.
  const [design, setDesign] = useState<unknown>(null);
  const [page, setPage] = useState<PreviewPage>('home');
  const [promoPreview, setPromoPreview] = useState(0);

  const { data: info, isLoading } = useQuery({
    queryKey: ['storefront', slug],
    queryFn: () => storefrontApi.getInfo(slug),
    enabled: !!slug,
  });

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      if (!isPreviewMessage(e.data)) return;
      if (e.data.type === 'sf-design') setDesign(e.data.design);
      if (e.data.type === 'sf-page') setPage(e.data.page);
      if (e.data.type === 'sf-promo') setPromoPreview(e.data.open);
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
    <StorefrontProvider slug={slug} info={info} isLoading={isLoading} designOverride={design} preview activePage={page} promoPreview={promoPreview}>
      <PreviewBody page={page} />
    </StorefrontProvider>
  );
}

/** What the editor's iframe shows: a storefront page rendered from a design sent by the editor (never saved here). */
export default function StorefrontPreviewPage() {
  return (
    <Suspense fallback={null}>
      <PreviewPage />
    </Suspense>
  );
}
