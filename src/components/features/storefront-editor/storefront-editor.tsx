'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, ExternalLink, Loader2, Lock, MoreHorizontal, RotateCcw, Save, Send, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { settingsApi } from '@/lib/api/settings';
import { storefrontDesignApi, type StorefrontDesignState } from '@/lib/api/storefront-design';
import { normalizeDesign, type StorefrontDesign } from '@/lib/storefront/design';
import { clientValidate, designsEqual } from '@/lib/storefront/editor-model';
import { storefrontUrl } from '@/lib/storefront/url';
import { useStoreDomain } from '@/components/features/domains/use-store-domain';
import { cn, getApiError } from '@/lib/utils';
import BrandControls from './brand-controls';
import LivePreview from './live-preview';
import { CartControls, ProductPageControls } from './pages-controls';
import { CustomPageSettings, PagesPanel, isEditorPage, type EditorPage } from './pages-panel';
import PreviewLinkDialog from './preview-link';
import SectionListEditor from './section-list-editor';
import SeoControls from './seo-controls';
import TemplatePicker from './template-picker';

const DESIGN_KEY = ['storefront-design'];

type Status = { label: string; tone: 'live' | 'pending' | 'none' };

const LARGE = '(min-width: 1024px)';

/** True from the `lg` breakpoint up, so only one of the two editor layouts (and one preview iframe) is mounted. */
function useIsLarge(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(LARGE);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(LARGE).matches,
    () => true,
  );
}

/** A design you are editing: a chip for where it stands, the two save buttons, controls on the left and a live preview on the right. */
export default function StorefrontEditor() {
  const qc = useQueryClient();
  const business = useQuery({ queryKey: ['business-settings'], queryFn: settingsApi.getSettings });
  const designState = useQuery({ queryKey: DESIGN_KEY, queryFn: storefrontDesignApi.get });

  // `edits` holds unsaved changes; null means "show what is saved".
  const [edits, setEdits] = useState<StorefrontDesign | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  /** Which button just succeeded, so it can show a tick for a moment. */
  const [done, setDone] = useState<'save' | 'publish' | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(doneTimer.current), []);
  const markDone = (which: 'save' | 'publish') => {
    setDone(which);
    clearTimeout(doneTimer.current);
    doneTimer.current = setTimeout(() => setDone(null), 1600);
  };
  const [currentPage, setCurrentPage] = useState<EditorPage>('home');
  const isLarge = useIsLarge();

  const themeColor = business.data?.themeColor;
  const customDomain = useStoreDomain();
  const state: StorefrontDesignState | undefined = designState.data;

  /** What is saved on the server for the editor to start from: the draft, else the live design, else Classic. */
  const saved = useMemo<StorefrontDesign>(
    () => normalizeDesign(state?.draft ?? state?.published ?? null, themeColor),
    [state, themeColor],
  );
  const working = edits ?? saved;
  const dirty = edits !== null && !designsEqual(edits, saved);

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const fail = (err: unknown, fallback: string) => {
    const message = getApiError(err, fallback);
    setProblem(message);
    toast.error(message);
  };

  const accept = (next: StorefrontDesignState) => {
    qc.setQueryData(DESIGN_KEY, next);
    setEdits(null);
    setProblem(null);
  };

  const checked = (): boolean => {
    const message = clientValidate(working);
    setProblem(message);
    if (message) toast.error(message);
    return message === null;
  };

  const save = useMutation({
    mutationFn: () => storefrontDesignApi.saveDraft(working),
    onSuccess: (next) => {
      accept(next);
      markDone('save');
      toast.success('Draft saved.');
    },
    onError: (err) => fail(err, 'Could not save your design.'),
  });

  const publish = useMutation({
    mutationFn: async () => {
      if (dirty || !state?.draft) await storefrontDesignApi.saveDraft(working);
      return storefrontDesignApi.publish();
    },
    onSuccess: (next) => {
      accept(next);
      // Publishing also moves the business's brand colour, and shoppers' cached storefront is now out of date.
      qc.invalidateQueries({ queryKey: ['business-settings'] });
      qc.invalidateQueries({ queryKey: ['storefront'] });
      markDone('publish');
      toast.success('Published. Shoppers now see this design.');
    },
    onError: (err) => fail(err, 'Could not publish your design.'),
  });

  const reset = useMutation({
    mutationFn: storefrontDesignApi.reset,
    onSuccess: (next) => {
      accept(next);
      qc.invalidateQueries({ queryKey: ['storefront'] });
      setConfirmReset(false);
      toast.success('Your store is back to the Classic look.');
    },
    onError: (err) => {
      setConfirmReset(false);
      fail(err, 'Could not reset your design.');
    },
  });

  const busy = save.isPending || publish.isPending || reset.isPending;

  /** Saves the working draft for the preview-link dialog, which needs it saved; errors are shown by the mutation itself. */
  const saveForLink = async () => {
    if (!checked()) return;
    try {
      await save.mutateAsync();
    } catch {
      // already reported
    }
  };
  const hasUnpublished = !!state?.hasUnpublishedChanges;
  const canPublish = dirty || hasUnpublished;

  const status: Status = !state?.published
    ? { label: 'Not published yet. Shoppers see the Classic look.', tone: 'none' }
    : dirty || hasUnpublished
      ? { label: 'Unpublished changes', tone: 'pending' }
      : { label: 'Live design', tone: 'live' };

  if (business.isLoading || designState.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
          <Skeleton className="h-[480px]" />
          <Skeleton className="hidden h-[480px] lg:block" />
        </div>
      </div>
    );
  }

  if (business.isError || designState.isError || !business.data) {
    return (
      <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {getApiError(designState.error ?? business.error, 'Could not load your storefront design.')}
      </div>
    );
  }

  const slug = business.data.slug;
  /** The server decides; this only keeps the screen honest about it. */
  const canEdit = state?.canEdit !== false;
  const edit = (next: StorefrontDesign) => {
    if (canEdit) setEdits(next);
  };
  // An extra page can disappear (deleted, or the design was reset): fall back to Home rather than editing nothing.
  const page: EditorPage = isEditorPage(working, currentPage) ? currentPage : 'home';
  const isCustomPage = page !== 'home' && page !== 'product' && page !== 'cart';

  const controls = (
    <div className="space-y-4">
      <PagesPanel design={working} current={page} onSelect={setCurrentPage} onChange={edit} readOnly={!canEdit} />
      {/* Everything below is locked for someone who may look but not change the design. */}
      <fieldset disabled={!canEdit} className="m-0 min-w-0 border-0 p-0">
      {/* Keyed by page so switching pages cross-fades the controls instead of swapping them. */}
      <div key={page} className="animate-in fade-in-0 slide-in-from-bottom-1 space-y-4 duration-300 ease-(--ease-out)">
      {page === 'home' && (
        <>
          <TemplatePicker
            design={working}
            onApply={(next) => {
              edit(next);
              setCurrentPage('home');
            }}
          />
          <BrandControls design={working} onChange={edit} />
          <SeoControls
            design={working}
            onChange={edit}
            slug={business.data.slug}
            fallback={{ name: business.data.name, description: business.data.description ?? '', logo: business.data.logo }}
          />
          <SectionListEditor key="home" design={working} onChange={edit} page="home" />
        </>
      )}
      {isCustomPage && (
        <>
          <CustomPageSettings design={working} page={page} onChange={edit} onDeleted={() => setCurrentPage('home')} />
          <SectionListEditor key={page} design={working} onChange={edit} page={page} />
        </>
      )}
      {page === 'product' && <ProductPageControls design={working} onChange={edit} />}
      {page === 'cart' && <CartControls design={working} onChange={edit} />}
      </div>
      </fieldset>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b bg-surface-low/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight">Storefront</h1>
          <p
            role="status"
            className={cn(
              'mt-0.5 flex items-center gap-1.5 text-xs font-medium transition-colors duration-300',
              status.tone === 'live' && 'text-green-700',
              status.tone === 'pending' && 'text-amber-700',
              status.tone === 'none' && 'text-muted-foreground',
            )}
          >
            <span
              aria-hidden="true"
              className={cn('h-2 w-2 shrink-0 rounded-full transition-colors duration-300', status.tone === 'live' ? 'bg-green-600' : status.tone === 'pending' ? 'bg-amber-500' : 'bg-slate-400')}
            />
            {status.label}
            {dirty && <span className="font-normal text-muted-foreground"> · unsaved edits</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={storefrontUrl(slug, '', customDomain)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            <ExternalLink />
            View live store
          </a>
          <Button
            type="button"
            variant="outline"
            disabled={!canEdit || !dirty || busy}
            onClick={() => {
              if (checked()) save.mutate();
            }}
          >
            {save.isPending ? <Loader2 className="animate-spin" /> : done === 'save' ? <Check key="saved" className="sf-pop text-green-600" /> : <Save />}
            Save draft
          </Button>
          <Button
            type="button"
            disabled={!canEdit || !canPublish || busy}
            onClick={() => {
              if (checked()) publish.mutate();
            }}
          >
            {publish.isPending ? <Loader2 className="animate-spin" /> : done === 'publish' ? <Check key="published" className="sf-pop" /> : <Send />}
            Publish
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger type="button" aria-label="More actions" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled={!canEdit} onClick={() => setShareOpen(true)}>
                <Share2 className="mr-2 h-4 w-4 text-muted-foreground" />
                Share a draft preview
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canEdit || (!state?.draft && !state?.published)} onClick={() => setConfirmReset(true)}>
                <RotateCcw className="mr-2 h-4 w-4 text-muted-foreground" />
                Reset to Classic
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {!canEdit && (
        <div role="note" className="animate-in fade-in-0 slide-in-from-top-2 flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            You can look at this storefront design but not change it. Ask the business owner or a team admin if you need to make changes.
          </span>
        </div>
      )}

      {problem && (
        <div role="alert" className="animate-in fade-in-0 slide-in-from-top-2 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{problem}</span>
        </div>
      )}

      {isLarge ? (
        // Large screens: controls and preview side by side.
        <div className="grid gap-5 grid-cols-[400px_minmax(0,1fr)]">
          <div>{controls}</div>
          <div className="sticky top-[88px] h-[calc(100dvh-8rem)] self-start">
            <LivePreview slug={slug} design={working} page={page} className="h-full" />
          </div>
        </div>
      ) : (
        // Phones and tablets: one at a time.
        <Tabs defaultValue="design">
          <TabsList className="w-full">
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="design" className="pt-2">
            {controls}
          </TabsContent>
          <TabsContent value="preview" className="pt-2">
            <LivePreview slug={slug} design={working} page={page} className="h-[70dvh]" />
          </TabsContent>
        </Tabs>
      )}

      <PreviewLinkDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        slug={slug}
        state={state}
        dirty={dirty}
        onSave={saveForLink}
        saving={save.isPending}
        onState={(next) => qc.setQueryData(DESIGN_KEY, next)}
      />

      <Dialog open={confirmReset} onOpenChange={(open) => !open && !reset.isPending && setConfirmReset(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset to the Classic look?</DialogTitle>
            <DialogDescription>
              This deletes your saved design, including the live one. Shoppers will see the Classic storefront straight away. You can’t undo this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={reset.isPending} onClick={() => setConfirmReset(false)}>
              Keep my design
            </Button>
            <Button type="button" variant="destructive" disabled={reset.isPending} onClick={() => reset.mutate()}>
              {reset.isPending && <Loader2 className="animate-spin" />}
              Reset to Classic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
