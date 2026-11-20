'use client';

import { useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  CircleHelp,
  Columns2,
  Eye,
  EyeOff,
  FileText,
  ImageIcon,
  Images,
  LayoutGrid,
  MapPin,
  Megaphone,
  MessageSquareQuote,
  MousePointerClick,
  Plus,
  Share2,
  Star,
  Tags,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SECTION_BLURB,
  SECTION_LABEL,
  addSection,
  addableTypes,
  isRequiredSection,
  mapSection,
  moveSection,
  removeSection,
  sectionSummary,
  sectionsOf,
  setHidden,
  MAX_SECTIONS,
} from '@/lib/storefront/editor-model';
import type { PageKey, SectionType, StorefrontDesign } from '@/lib/storefront/design';
import { cn } from '@/lib/utils';
import { Collapse, Leaving, prefersReducedMotion, useLeaving } from './collapse';
import { Panel } from './controls';
import SectionEditor from './section-editors';

const ICONS: Record<SectionType, ComponentType<{ className?: string }>> = {
  announcement: Megaphone,
  hero: ImageIcon,
  products: LayoutGrid,
  about: FileText,
  info: MapPin,
  featured: Star,
  categories: Tags,
  imageText: Columns2,
  gallery: Images,
  faq: CircleHelp,
  testimonials: MessageSquareQuote,
  cta: MousePointerClick,
  socials: Share2,
};

interface Props {
  design: StorefrontDesign;
  onChange: (design: StorefrontDesign) => void;
  /** Which page's sections to edit; the home page by default. */
  page?: PageKey;
}

/** The page's sections in order, with reorder, hide, delete and per-section editing, and a menu to add more. */
export default function SectionListEditor({ design, onChange, page = 'home' }: Props) {
  const sections = sectionsOf(design, page);
  const pageHasProducts = sections.some((s) => s.type === 'products' && !s.hidden);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const addable = addableTypes(design, page);
  const { leaving, leave } = useLeaving<string>();

  // Reordering: rows glide to their new place (FLIP) and the moved row flashes, instead of swapping instantly.
  const rows = useRef(new Map<string, HTMLLIElement>());
  const before = useRef<Map<string, number> | null>(null);
  const movedId = useRef<string | null>(null);
  const orderKey = sections.map((s) => s.id).join('|');

  const rememberPositions = (id: string) => {
    const map = new Map<string, number>();
    rows.current.forEach((el, key) => map.set(key, el.getBoundingClientRect().top));
    before.current = map;
    movedId.current = id;
  };

  useLayoutEffect(() => {
    const previous = before.current;
    const moved = movedId.current;
    before.current = null;
    movedId.current = null;
    if (!previous || prefersReducedMotion()) return;
    rows.current.forEach((el, id) => {
      const from = previous.get(id);
      if (from === undefined || typeof el.animate !== 'function') return;
      const delta = from - el.getBoundingClientRect().top;
      if (Math.abs(delta) > 1) {
        el.animate([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
      }
      if (id === moved) {
        el.animate(
          [{ backgroundColor: 'color-mix(in oklab, var(--primary) 14%, transparent)' }, { backgroundColor: 'var(--background)' }],
          { duration: 1100, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        );
      }
    });
  }, [orderKey]);

  const add = (type: SectionType) => {
    const { design: next, id } = addSection(design, type, page);
    onChange(next);
    setOpenId(id);
    setAddedId(id);
    setAdding(false);
  };

  const move = (id: string, direction: -1 | 1) => {
    rememberPositions(id);
    onChange(moveSection(design, id, direction, page));
  };

  return (
    <Panel title="Sections" description={`What ${page === 'home' ? 'your home page' : 'this page'} shows, from top to bottom. Hidden sections stay saved but shoppers don’t see them.`}>
      <ol>
        {sections.map((s, index) => {
          const Icon = ICONS[s.type];
          const open = openId === s.id;
          const required = isRequiredSection(s, page);
          const label = SECTION_LABEL[s.type];
          return (
            <Leaving key={s.id} leaving={leaving === s.id}>
              <li
                ref={(el) => {
                  if (el) rows.current.set(s.id, el);
                  else rows.current.delete(s.id);
                }}
                className={cn(
                  'rounded-lg border bg-background transition-[opacity,box-shadow,border-color] duration-300 ease-(--ease-out)',
                  s.hidden && 'opacity-60',
                  open && 'shadow-sm',
                  addedId === s.id && 'sf-rise',
                )}
              >
                <div className="flex items-center gap-1 p-1.5">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`section-editor-${s.id}`}
                    onClick={() => setOpenId(open ? null : s.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1.5 py-1 text-left outline-none transition-colors duration-200 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-tight">
                        {label}
                        {s.hidden && <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">Hidden</span>}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{sectionSummary(s)}</span>
                    </span>
                    <ChevronDown
                      className={cn('ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-(--ease-out)', open && 'rotate-180')}
                      aria-hidden="true"
                    />
                  </button>
                  <div className="flex shrink-0 items-center">
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => move(s.id, -1)}>
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      aria-label={`Move ${label} down`}
                      disabled={index === sections.length - 1}
                      onClick={() => move(s.id, 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      aria-label={s.hidden ? `Show ${label}` : `Hide ${label}`}
                      title={required ? 'Your products always stay visible' : undefined}
                      disabled={required}
                      onClick={() => onChange(setHidden(design, s.id, !s.hidden, page))}
                    >
                      {s.hidden ? <EyeOff /> : <Eye />}
                    </Button>
                    {!required && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        aria-label={`Delete ${label}`}
                        onClick={() => leave(s.id, () => onChange(removeSection(design, s.id, page)))}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </div>
                <Collapse open={open}>
                  <div id={`section-editor-${s.id}`} className="border-t p-3">
                    <SectionEditor section={s} pageHasProducts={pageHasProducts} onChange={(next) => onChange(mapSection(design, s.id, () => next, page))} />
                  </div>
                </Collapse>
              </li>
            </Leaving>
          );
        })}
      </ol>

      <Collapse open={adding}>
        <div className="space-y-1.5 rounded-lg border bg-muted/30 p-2" role="group" aria-label="Add a section">
          {addable.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              {sections.length >= MAX_SECTIONS ? `A page can have at most ${MAX_SECTIONS} sections.` : 'Every kind of section is already on your page.'}
            </p>
          ) : (
            addable.map((type, i) => {
              const Icon = ICONS[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => add(type)}
                  style={{ '--sf-i': i } as React.CSSProperties}
                  className="sf-fade-in flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left outline-none transition-colors duration-200 hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block text-sm font-medium leading-tight">{SECTION_LABEL[type]}</span>
                    <span className="block text-xs text-muted-foreground">{SECTION_BLURB[type]}</span>
                  </span>
                </button>
              );
            })
          )}
          <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      </Collapse>
      {!adding && (
        <Button type="button" variant="outline" className="w-full" disabled={addable.length === 0} onClick={() => setAdding(true)}>
          <Plus />
          Add a section
        </Button>
      )}
    </Panel>
  );
}
