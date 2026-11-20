'use client';

import { useState, type ComponentType } from 'react';
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
  const addable = addableTypes(design, page);

  const add = (type: SectionType) => {
    const { design: next, id } = addSection(design, type, page);
    onChange(next);
    setOpenId(id);
    setAdding(false);
  };

  return (
    <Panel title="Sections" description={`What ${page === 'home' ? 'your home page' : 'this page'} shows, from top to bottom. Hidden sections stay saved but shoppers don’t see them.`}>
      <ol className="space-y-2">
        {sections.map((s, index) => {
          const Icon = ICONS[s.type];
          const open = openId === s.id;
          const required = isRequiredSection(s, page);
          const label = SECTION_LABEL[s.type];
          return (
            <li key={s.id} className={cn('rounded-lg border bg-background', s.hidden && 'opacity-70')}>
              <div className="flex items-center gap-1 p-1.5">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`section-editor-${s.id}`}
                  onClick={() => setOpenId(open ? null : s.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1.5 py-1 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-tight">
                      {label}
                      {s.hidden && <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">Hidden</span>}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{sectionSummary(s)}</span>
                  </span>
                  <ChevronDown className={cn('ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden="true" />
                </button>
                <div className="flex shrink-0 items-center">
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onChange(moveSection(design, s.id, -1, page))}>
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    aria-label={`Move ${label} down`}
                    disabled={index === sections.length - 1}
                    onClick={() => onChange(moveSection(design, s.id, 1, page))}
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
                      onClick={() => onChange(removeSection(design, s.id, page))}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
              </div>
              {open && (
                <div id={`section-editor-${s.id}`} className="border-t p-3">
                  <SectionEditor section={s} pageHasProducts={pageHasProducts} onChange={(next) => onChange(mapSection(design, s.id, () => next, page))} />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {adding ? (
        <div className="space-y-1.5 rounded-lg border bg-muted/30 p-2" role="group" aria-label="Add a section">
          {addable.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              {sections.length >= MAX_SECTIONS ? `A page can have at most ${MAX_SECTIONS} sections.` : 'Every kind of section is already on your page.'}
            </p>
          ) : (
            addable.map((type) => {
              const Icon = ICONS[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => add(type)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
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
      ) : (
        <Button type="button" variant="outline" className="w-full" disabled={addable.length === 0} onClick={() => setAdding(true)}>
          <Plus />
          Add a section
        </Button>
      )}
    </Panel>
  );
}
