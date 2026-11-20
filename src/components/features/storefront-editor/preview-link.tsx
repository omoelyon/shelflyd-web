'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Copy, ExternalLink, Link2Off, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { storefrontDesignApi, type StorefrontDesignState } from '@/lib/api/storefront-design';
import { storefrontUrl } from '@/lib/storefront/url';
import { getApiError } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  /** The saved design state (its `previewToken` says whether a link exists). */
  state: StorefrontDesignState | undefined;
  /** True when there are edits that are not saved yet: the link only ever shows what is saved. */
  dirty: boolean;
  /** Saves the working draft; resolves once saved (the editor's own save button does the same). */
  onSave: () => Promise<unknown>;
  saving: boolean;
  /** Receives the new state after the link is created, replaced or turned off. */
  onState: (next: StorefrontDesignState) => void;
}

/** Share a private link to the SAVED draft, so a partner or friend can look at it before it goes live. */
export default function PreviewLinkDialog({ open, onOpenChange, slug, state, dirty, onSave, saving, onState }: Props) {
  const [confirmRotate, setConfirmRotate] = useState(false);
  const token = state?.previewToken ?? null;
  const hasDraft = !!state?.draft;
  const link = token ? `${storefrontUrl(slug)}?preview=${encodeURIComponent(token)}` : '';

  const fail = (err: unknown, fallback: string) => toast.error(getApiError(err, fallback));

  const create = useMutation({
    mutationFn: storefrontDesignApi.createPreviewLink,
    onSuccess: onState,
    onError: (err) => fail(err, 'Could not create the preview link.'),
  });
  const rotate = useMutation({
    mutationFn: storefrontDesignApi.rotatePreviewLink,
    onSuccess: (next) => {
      onState(next);
      setConfirmRotate(false);
      toast.success('New link created. The old one no longer works.');
    },
    onError: (err) => {
      setConfirmRotate(false);
      fail(err, 'Could not create a new link.');
    },
  });
  const revoke = useMutation({
    mutationFn: storefrontDesignApi.revokePreviewLink,
    onSuccess: (next) => {
      onState(next);
      toast.success('Preview link turned off.');
    },
    onError: (err) => fail(err, 'Could not turn off the link.'),
  });
  const busy = create.isPending || rotate.isPending || revoke.isPending || saving;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied.');
    } catch {
      toast.error('Could not copy. Select the link and copy it by hand.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share a draft preview</DialogTitle>
          <DialogDescription>
            Anyone with this link can see your <strong>saved draft</strong> before it goes live. Shoppers still see the published store, and the link
            is hidden from search engines.
          </DialogDescription>
        </DialogHeader>

        {dirty && (
          <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
            You have edits that aren’t saved. The link only shows what’s saved, so save your draft first.
            <div className="mt-2">
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void onSave()}>
                {saving && <Loader2 className="animate-spin" />}
                Save draft
              </Button>
            </div>
          </div>
        )}

        {!token ? (
          <div className="space-y-2">
            <Button type="button" disabled={busy || dirty || !hasDraft} onClick={() => create.mutate()}>
              {create.isPending && <Loader2 className="animate-spin" />}
              Create preview link
            </Button>
            {!hasDraft && !dirty && <p className="text-xs text-muted-foreground">Save a draft first, then you can create a link to it.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input readOnly value={link} aria-label="Draft preview link" onFocus={(e) => e.currentTarget.select()} />
              <Button type="button" variant="outline" onClick={() => void copy()}>
                <Copy />
                Copy
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href={link} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <ExternalLink />
                Open
              </a>
              <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmRotate(true)}>
                <RefreshCw />
                Make a new link
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => revoke.mutate()}>
                {revoke.isPending ? <Loader2 className="animate-spin" /> : <Link2Off />}
                Turn off link
              </Button>
            </div>
            {confirmRotate && (
              <div role="alert" className="rounded-lg border bg-muted/40 p-3 text-xs">
                <p>Make a new link? The current one will stop working straight away for anyone you shared it with.</p>
                <div className="mt-2 flex gap-2">
                  <Button type="button" size="sm" disabled={rotate.isPending} onClick={() => rotate.mutate()}>
                    {rotate.isPending && <Loader2 className="animate-spin" />}
                    Make a new link
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={rotate.isPending} onClick={() => setConfirmRotate(false)}>
                    Keep the current link
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
