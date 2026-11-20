'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ExternalLink, Loader2, MoreHorizontal, RotateCcw, Save, Send } from 'lucide-react';
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
import { cn, getApiError } from '@/lib/utils';
import BrandControls from './brand-controls';
import LivePreview from './live-preview';
import SectionListEditor from './section-list-editor';
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
  const isLarge = useIsLarge();

  const themeColor = business.data?.themeColor;
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
  const edit = (next: StorefrontDesign) => setEdits(next);

  const controls = (
    <div className="space-y-4">
      <TemplatePicker design={working} onApply={edit} />
      <BrandControls design={working} onChange={edit} />
      <SectionListEditor design={working} onChange={edit} />
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
              'mt-0.5 flex items-center gap-1.5 text-xs font-medium',
              status.tone === 'live' && 'text-green-700',
              status.tone === 'pending' && 'text-amber-700',
              status.tone === 'none' && 'text-muted-foreground',
            )}
          >
            <span
              aria-hidden="true"
              className={cn('h-2 w-2 shrink-0 rounded-full', status.tone === 'live' ? 'bg-green-600' : status.tone === 'pending' ? 'bg-amber-500' : 'bg-slate-400')}
            />
            {status.label}
            {dirty && <span className="font-normal text-muted-foreground"> · unsaved edits</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/storefront/${slug}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            <ExternalLink />
            View live store
          </a>
          <Button
            type="button"
            variant="outline"
            disabled={!dirty || busy}
            onClick={() => {
              if (checked()) save.mutate();
            }}
          >
            {save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
            Save draft
          </Button>
          <Button
            type="button"
            disabled={!canPublish || busy}
            onClick={() => {
              if (checked()) publish.mutate();
            }}
          >
            {publish.isPending ? <Loader2 className="animate-spin" /> : <Send />}
            Publish
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger type="button" aria-label="More actions" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled={!state?.draft && !state?.published} onClick={() => setConfirmReset(true)}>
                <RotateCcw className="mr-2 h-4 w-4 text-muted-foreground" />
                Reset to Classic
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {problem && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{problem}</span>
        </div>
      )}

      {isLarge ? (
        // Large screens: controls and preview side by side.
        <div className="grid gap-5 grid-cols-[400px_minmax(0,1fr)]">
          <div>{controls}</div>
          <div className="sticky top-[88px] h-[calc(100dvh-8rem)] self-start">
            <LivePreview slug={slug} design={working} className="h-full" />
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
            <LivePreview slug={slug} design={working} className="h-[70dvh]" />
          </TabsContent>
        </Tabs>
      )}

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
