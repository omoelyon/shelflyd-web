/**
 * The storefront design document: everything that makes one business's storefront look the way it does.
 * Templates, "customise a template" and "build from scratch" are all just different starting documents for
 * this one shape, so there is a single renderer and a single editor. The backend validates the same shape
 * (StorefrontDesignValidator) — keep the two in step and bump DESIGN_VERSION when it changes incompatibly.
 *
 * A business with no saved design renders CLASSIC, which reproduces the storefront as it always looked.
 */

export const DESIGN_VERSION = 1;

export type RadiusKey = 'sharp' | 'soft' | 'round';
export type FontKey = 'manrope' | 'inter' | 'serif';
export type HeaderVariant = 'classic' | 'centered';
export type FooterVariant = 'dark' | 'light';

export interface StorefrontTheme {
  /** Brand colour (#rrggbb). Buttons, badges, links and accents derive from it. */
  primary: string;
  radius: RadiusKey;
  headingFont: FontKey;
  bodyFont: FontKey;
}

export interface StorefrontHeader {
  variant: HeaderVariant;
  sticky: boolean;
}

export interface StorefrontFooter {
  variant: FooterVariant;
}

// ─── Sections ────────────────────────────────────────────────────────────────

interface SectionBase {
  /** Stable id within the design (used as the React key and by the editor). */
  id: string;
  hidden?: boolean;
}

export interface AnnouncementSection extends SectionBase {
  type: 'announcement';
  variant: 'bar';
  props: { text: string; link: string };
}

export interface HeroSection extends SectionBase {
  type: 'hero';
  /** tinted: soft brand-coloured card (the classic look). banner: full-width image or brand colour with large text. */
  variant: 'tinted' | 'banner';
  props: {
    /** Falls back to the business name. */
    heading: string;
    /** Falls back to the business description. */
    tagline: string;
    /** Banner image URL; empty = a brand-colour banner. */
    image: string;
    showOpenBadge: boolean;
    /** Shown with a pin icon when not empty (e.g. "Yaba, Lagos"). */
    location: string;
  };
}

export interface ProductsSection extends SectionBase {
  type: 'products';
  /**
   * grid: image-led cards with description and price (the classic look). portrait: tall 3:4 photos with just the
   * name and price, no card chrome (fashion/beauty). compact: small dense cards for catalogues with many products.
   */
  variant: 'grid' | 'portrait' | 'compact';
  props: { title: string; columns: 3 | 4; showSearch: boolean; showSets: boolean };
}

export interface AboutSection extends SectionBase {
  type: 'about';
  variant: 'plain';
  props: { title: string; body: string };
}

export interface InfoSection extends SectionBase {
  type: 'info';
  variant: 'strip';
  props: { address: string; hours: string; phone: string; email: string };
}

export type StorefrontSection = AnnouncementSection | HeroSection | ProductsSection | AboutSection | InfoSection;
export type SectionType = StorefrontSection['type'];

export interface StorefrontDesign {
  version: number;
  /** Which template this started from (informational; the document itself is the source of truth). */
  template: string;
  theme: StorefrontTheme;
  header: StorefrontHeader;
  footer: StorefrontFooter;
  pages: { home: { sections: StorefrontSection[] } };
}

// ─── Classic: the storefront as it was before designs existed ────────────────

export const DEFAULT_PRIMARY = '#16a34a';

export function classicDesign(primary: string = DEFAULT_PRIMARY): StorefrontDesign {
  return {
    version: DESIGN_VERSION,
    template: 'classic',
    theme: { primary, radius: 'soft', headingFont: 'manrope', bodyFont: 'inter' },
    header: { variant: 'classic', sticky: true },
    footer: { variant: 'dark' },
    pages: {
      home: {
        sections: [
          { id: 'hero', type: 'hero', variant: 'tinted', props: { heading: '', tagline: '', image: '', showOpenBadge: true, location: '' } },
          { id: 'products', type: 'products', variant: 'grid', props: { title: 'Products', columns: 4, showSearch: true, showSets: true } },
        ],
      },
    },
  };
}

// ─── Reading a design defensively ────────────────────────────────────────────

const HEX = /^#[0-9a-fA-F]{6}$/;
const RADII: RadiusKey[] = ['sharp', 'soft', 'round'];
const FONTS: FontKey[] = ['manrope', 'inter', 'serif'];

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

function normalizeSection(raw: unknown, index: number): StorefrontSection | null {
  const s = obj(raw);
  const props = obj(s.props);
  const id = str(s.id) || `section-${index}`;
  const hidden = s.hidden === true ? true : undefined;
  switch (s.type) {
    case 'announcement':
      return { id, hidden, type: 'announcement', variant: 'bar', props: { text: str(props.text), link: str(props.link) } };
    case 'hero':
      return {
        id,
        hidden,
        type: 'hero',
        variant: oneOf(s.variant, ['tinted', 'banner'] as const, 'tinted'),
        props: {
          heading: str(props.heading),
          tagline: str(props.tagline),
          image: str(props.image),
          showOpenBadge: bool(props.showOpenBadge, true),
          location: str(props.location),
        },
      };
    case 'products':
      return {
        id,
        hidden,
        type: 'products',
        variant: oneOf(s.variant, ['grid', 'portrait', 'compact'] as const, 'grid'),
        props: {
          title: str(props.title, 'Products'),
          columns: props.columns === 3 ? 3 : 4,
          showSearch: bool(props.showSearch, true),
          showSets: bool(props.showSets, true),
        },
      };
    case 'about':
      return { id, hidden, type: 'about', variant: 'plain', props: { title: str(props.title, 'About us'), body: str(props.body) } };
    case 'info':
      return {
        id,
        hidden,
        type: 'info',
        variant: 'strip',
        props: { address: str(props.address), hours: str(props.hours), phone: str(props.phone), email: str(props.email) },
      };
    default:
      return null; // an unknown section type (e.g. from a newer version) is skipped, never crashes the page
  }
}

/**
 * Turns whatever the server sent into a complete, safe design. Anything missing or unrecognised falls back to
 * Classic's values; `fallbackPrimary` is the business's own theme colour so an unsaved store keeps its colour.
 */
export function normalizeDesign(raw: unknown, fallbackPrimary?: string | null): StorefrontDesign {
  const base = classicDesign(fallbackPrimary && HEX.test(fallbackPrimary) ? fallbackPrimary : DEFAULT_PRIMARY);
  if (!raw || typeof raw !== 'object') return base;
  const d = obj(raw);
  const theme = obj(d.theme);
  const header = obj(d.header);
  const footer = obj(d.footer);
  const rawSections = obj(obj(d.pages).home).sections;
  const sections = Array.isArray(rawSections)
    ? rawSections.map(normalizeSection).filter((s): s is StorefrontSection => s !== null)
    : base.pages.home.sections;
  return {
    version: DESIGN_VERSION,
    template: str(d.template, 'classic'),
    theme: {
      primary: typeof theme.primary === 'string' && HEX.test(theme.primary) ? theme.primary : base.theme.primary,
      radius: oneOf(theme.radius, RADII, base.theme.radius),
      headingFont: oneOf(theme.headingFont, FONTS, base.theme.headingFont),
      bodyFont: oneOf(theme.bodyFont, FONTS, base.theme.bodyFont),
    },
    header: { variant: oneOf(header.variant, ['classic', 'centered'] as const, 'classic'), sticky: bool(header.sticky, true) },
    footer: { variant: oneOf(footer.variant, ['dark', 'light'] as const, 'dark') },
    pages: { home: { sections } },
  };
}

// ─── Theme → CSS ─────────────────────────────────────────────────────────────

/** Black or white, whichever is readable on top of `hex` (WCAG relative luminance). */
export function readableTextOn(hex: string): '#ffffff' | '#0b1220' {
  if (!HEX.test(hex)) return '#ffffff';
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.4 ? '#0b1220' : '#ffffff';
}

export const RADIUS_REM: Record<RadiusKey, string> = { sharp: '0.125rem', soft: '0.625rem', round: '1.25rem' };

/** Heading/body font stacks. Manrope and Inter are already loaded by the app; "serif" is a system stack. */
export const FONT_STACKS: Record<FontKey, string> = {
  manrope: 'var(--font-manrope), system-ui, sans-serif',
  inter: 'var(--font-inter), system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
};

/**
 * The CSS custom properties a design sets. They are applied on <html> (not a wrapper) so dialogs and sheets,
 * which render in a portal outside the storefront, pick up the same colours as the page.
 */
export function themeCssVars(theme: StorefrontTheme): Record<string, string> {
  return {
    '--primary': theme.primary,
    '--primary-foreground': readableTextOn(theme.primary),
    '--ring': theme.primary,
    '--sidebar-primary': theme.primary,
    '--sidebar-ring': theme.primary,
    '--radius': RADIUS_REM[theme.radius],
    '--sf-heading-font': FONT_STACKS[theme.headingFont],
    '--sf-body-font': FONT_STACKS[theme.bodyFont],
  };
}
