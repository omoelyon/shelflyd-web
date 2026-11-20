'use client';

import { useState, type ComponentType } from 'react';
import { FileText, Home, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { PageKey, StorefrontDesign } from '@/lib/storefront/design';
import { LIMITS, MAX_CUSTOM_PAGES, addCustomPage, customPage, removeCustomPage, updateCustomPage } from '@/lib/storefront/editor-model';
import { cn } from '@/lib/utils';
import { Field, Panel, ToggleRow } from './controls';

/** What the editor can be looking at: the home page, an extra page, or the product page or cart settings. */
export type EditorPage = PageKey | 'product' | 'cart';

/** True when `page` still exists in the design (an extra page can be deleted, or removed by resetting). */
export function isEditorPage(design: StorefrontDesign, page: EditorPage): boolean {
  return page === 'home' || page === 'product' || page === 'cart' || customPage(design, page) !== undefined;
}

interface PanelProps {
  design: StorefrontDesign;
  current: EditorPage;
  onSelect: (page: EditorPage) => void;
  onChange: (design: StorefrontDesign) => void;
}

function Entry({
  Icon,
  label,
  note,
  selected,
  onClick,
}: {
  Icon: ComponentType<{ className?: string }>;
  label: string;
  note?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
          selected ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'bg-background hover:bg-muted',
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
        {note && <span className="shrink-0 text-[11px] text-muted-foreground">{note}</span>}
      </button>
    </li>
  );
}

/** Pick which page to edit: Home, the seller's extra pages, then the product page and the cart. Also adds a page. */
export function PagesPanel({ design, current, onSelect, onChange }: PanelProps) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const full = design.pages.custom.length >= MAX_CUSTOM_PAGES;

  const submit = () => {
    const result = addCustomPage(design, title);
    if (!result) return;
    onChange(result.design);
    onSelect(result.key);
    setTitle('');
    setAdding(false);
  };

  return (
    <Panel title="Pages" description="Choose a page to edit. Extra pages can appear in your store’s menu.">
      <ul className="space-y-1.5">
        <Entry Icon={Home} label="Home" selected={current === 'home'} onClick={() => onSelect('home')} />
        {design.pages.custom.map((p) => (
          <Entry
            key={p.id}
            Icon={FileText}
            label={p.title || 'Untitled page'}
            note={p.showInNav ? undefined : 'Not in menu'}
            selected={current === `custom:${p.id}`}
            onClick={() => onSelect(`custom:${p.id}`)}
          />
        ))}
      </ul>

      {adding ? (
        <form
          className="space-y-2 rounded-lg border bg-muted/30 p-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="Page title" counter={`${title.length}/${LIMITS.pageTitle}`} hint="For example: About us, Delivery, Contact.">
            {(id) => (
              <Input id={id} value={title} maxLength={LIMITS.pageTitle} autoFocus onChange={(e) => setTitle(e.target.value)} placeholder="About us" />
            )}
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!title.trim()}>
              Add page
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setTitle('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div>
          <Button type="button" variant="outline" className="w-full" disabled={full} onClick={() => setAdding(true)}>
            <Plus />
            Add a page
          </Button>
          {full && <p className="mt-1.5 text-xs text-muted-foreground">You can have up to {MAX_CUSTOM_PAGES} extra pages.</p>}
        </div>
      )}

      <div className="border-t pt-3">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Shopping pages</p>
        <ul className="space-y-1.5">
          <Entry Icon={Package} label="Product page" selected={current === 'product'} onClick={() => onSelect('product')} />
          <Entry Icon={ShoppingCart} label="Cart" selected={current === 'cart'} onClick={() => onSelect('cart')} />
        </ul>
      </div>
    </Panel>
  );
}

interface CustomProps {
  design: StorefrontDesign;
  page: PageKey;
  onChange: (design: StorefrontDesign) => void;
  /** Called after the page is deleted so the editor can move to another page. */
  onDeleted: () => void;
}

/** Title, web address, menu visibility and delete for one extra page. */
export function CustomPageSettings({ design, page, onChange, onDeleted }: CustomProps) {
  const [confirm, setConfirm] = useState(false);
  const current = customPage(design, page);
  if (!current) return null;

  return (
    <Panel title="Page settings">
      <Field label="Title" counter={`${current.title.length}/${LIMITS.pageTitle}`}>
        {(id) => (
          <Input id={id} value={current.title} maxLength={LIMITS.pageTitle} onChange={(e) => onChange(updateCustomPage(design, page, { title: e.target.value }))} />
        )}
      </Field>
      <Field label="Web address" hint="Set when the page is created, so links to it keep working.">
        {(id) => <Input id={id} value={`/p/${current.id}`} readOnly />}
      </Field>
      <ToggleRow
        label="Show in the menu"
        hint="Adds a link to your header and footer."
        control={
          <Switch
            aria-label="Show this page in the menu"
            checked={current.showInNav}
            onCheckedChange={(showInNav) => onChange(updateCustomPage(design, page, { showInNav }))}
          />
        }
      />
      <Button type="button" variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => setConfirm(true)}>
        <Trash2 />
        Delete page
      </Button>

      <Dialog open={confirm} onOpenChange={(open) => !open && setConfirm(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{current.title || 'this page'}”?</DialogTitle>
            <DialogDescription>
              The page and its sections are removed from your design. Shoppers stop seeing it once you publish.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirm(false)}>
              Keep page
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onChange(removeCustomPage(design, page));
                setConfirm(false);
                onDeleted();
              }}
            >
              Delete page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
