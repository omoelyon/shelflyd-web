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

/** A hand-picked row of products (the seller chooses which, up to 12). */
export interface FeaturedSection extends SectionBase {
  type: 'featured';
  variant: 'grid' | 'portrait' | 'compact';
  props: { title: string; productIds: number[]; columns: 3 | 4 };
}

/** Category chips that filter the products section on the same page. Needs a products section on that page. */
export interface CategoriesSection extends SectionBase {
  type: 'categories';
  variant: 'chips';
  props: { title: string; showAll: boolean };
}

/** A photo next to a heading, a few lines and an optional button. */
export interface ImageTextSection extends SectionBase {
  type: 'imageText';
  variant: 'left' | 'right';
  props: { heading: string; body: string; image: string; buttonLabel: string; buttonLink: string };
}

export interface GalleryImage {
  url: string;
  caption: string;
}
export interface GallerySection extends SectionBase {
  type: 'gallery';
  variant: 'grid';
  props: { title: string; images: GalleryImage[] };
}

export interface FaqItem {
  question: string;
  answer: string;
}
export interface FaqSection extends SectionBase {
  type: 'faq';
  variant: 'list';
  props: { title: string; items: FaqItem[] };
}

export interface Testimonial {
  quote: string;
  name: string;
}
export interface TestimonialsSection extends SectionBase {
  type: 'testimonials';
  variant: 'cards';
  props: { title: string; items: Testimonial[] };
}

/** A coloured band with a heading, a line of text and a button. */
export interface CtaSection extends SectionBase {
  type: 'cta';
  variant: 'band';
  props: { heading: string; text: string; buttonLabel: string; buttonLink: string };
}

/** Links to the business's social profiles (https URLs). */
export interface SocialsSection extends SectionBase {
  type: 'socials';
  variant: 'row';
  props: { title: string; instagram: string; facebook: string; tiktok: string; x: string; youtube: string };
}

export type StorefrontSection =
  | AnnouncementSection
  | HeroSection
  | ProductsSection
  | AboutSection
  | InfoSection
  | FeaturedSection
  | CategoriesSection
  | ImageTextSection
  | GallerySection
  | FaqSection
  | TestimonialsSection
  | CtaSection
  | SocialsSection;
export type SectionType = StorefrontSection['type'];

export interface StorefrontDesign {
  version: number;
  /** Which template this started from (informational; the document itself is the source of truth). */
  template: string;
  theme: StorefrontTheme;
  header: StorefrontHeader;
  footer: StorefrontFooter;
  pages: StorefrontPages;
}

/** The product page: photo beside the details (split) or a big photo above them (stacked). */
export interface ProductPageSettings {
  layout: 'split' | 'stacked';
  imageRatio: 'square' | 'portrait' | 'wide';
}

/** The cart: a full page (as always), or a side drawer that slides in when the shopper adds something. */
export interface CartSettings {
  style: 'page' | 'drawer';
  /** A short note shown at the top of the cart, e.g. "Delivery takes 1–2 days". */
  message: string;
}

/** An extra page the seller adds (About, Delivery, FAQ…), built from the same sections as the home page. */
export interface CustomPage {
  /** URL part: /storefront/<slug>/p/<id>. Lower-case letters, digits and dashes. */
  id: string;
  title: string;
  /** Show a link to this page in the header. */
  showInNav: boolean;
  sections: StorefrontSection[];
}

export interface StorefrontPages {
  home: { sections: StorefrontSection[] };
  product: ProductPageSettings;
  cart: CartSettings;
  custom: CustomPage[];
}

/** Which page the editor/preview is looking at: the home page, or a custom page by id. */
export type PageKey = 'home' | `custom:${string}`;

export const MAX_CUSTOM_PAGES = 5;

/** The sections of a page of the design (empty for a custom page that no longer exists). */
export function sectionsForPage(d: StorefrontDesign, page: PageKey): StorefrontSection[] {
  if (page === 'home') return d.pages.home.sections;
  return d.pages.custom.find((p) => `custom:${p.id}` === page)?.sections ?? [];
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
      product: { layout: 'split', imageRatio: 'square' },
      cart: { style: 'page', message: '' },
      custom: [],
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
    case 'featured':
      return {
        id,
        hidden,
        type: 'featured',
        variant: oneOf(s.variant, ['grid', 'portrait', 'compact'] as const, 'grid'),
        props: {
          title: str(props.title, 'Featured'),
          productIds: Array.isArray(props.productIds)
            ? props.productIds.filter((n): n is number => typeof n === 'number' && Number.isFinite(n)).slice(0, 12)
            : [],
          columns: props.columns === 3 ? 3 : 4,
        },
      };
    case 'categories':
      return { id, hidden, type: 'categories', variant: 'chips', props: { title: str(props.title), showAll: bool(props.showAll, true) } };
    case 'imageText':
      return {
        id,
        hidden,
        type: 'imageText',
        variant: oneOf(s.variant, ['left', 'right'] as const, 'left'),
        props: {
          heading: str(props.heading),
          body: str(props.body),
          image: str(props.image),
          buttonLabel: str(props.buttonLabel),
          buttonLink: str(props.buttonLink),
        },
      };
    case 'gallery':
      return {
        id,
        hidden,
        type: 'gallery',
        variant: 'grid',
        props: {
          title: str(props.title),
          images: Array.isArray(props.images)
            ? props.images
                .map((i) => ({ url: str(obj(i).url), caption: str(obj(i).caption) }))
                .filter((i) => i.url)
                .slice(0, 8)
            : [],
        },
      };
    case 'faq':
      return {
        id,
        hidden,
        type: 'faq',
        variant: 'list',
        props: {
          title: str(props.title, 'Questions'),
          items: Array.isArray(props.items)
            ? props.items
                .map((i) => ({ question: str(obj(i).question), answer: str(obj(i).answer) }))
                .filter((i) => i.question)
                .slice(0, 10)
            : [],
        },
      };
    case 'testimonials':
      return {
        id,
        hidden,
        type: 'testimonials',
        variant: 'cards',
        props: {
          title: str(props.title, 'What customers say'),
          items: Array.isArray(props.items)
            ? props.items
                .map((i) => ({ quote: str(obj(i).quote), name: str(obj(i).name) }))
                .filter((i) => i.quote)
                .slice(0, 6)
            : [],
        },
      };
    case 'cta':
      return {
        id,
        hidden,
        type: 'cta',
        variant: 'band',
        props: { heading: str(props.heading), text: str(props.text), buttonLabel: str(props.buttonLabel), buttonLink: str(props.buttonLink) },
      };
    case 'socials':
      return {
        id,
        hidden,
        type: 'socials',
        variant: 'row',
        props: {
          title: str(props.title),
          instagram: str(props.instagram),
          facebook: str(props.facebook),
          tiktok: str(props.tiktok),
          x: str(props.x),
          youtube: str(props.youtube),
        },
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
  const rawPages = obj(d.pages);
  const normalizeList = (raw: unknown): StorefrontSection[] =>
    Array.isArray(raw) ? raw.map(normalizeSection).filter((x): x is StorefrontSection => x !== null) : [];
  const rawSections = obj(rawPages.home).sections;
  const sections = Array.isArray(rawSections) ? normalizeList(rawSections) : base.pages.home.sections;
  const product = obj(rawPages.product);
  const cart = obj(rawPages.cart);
  const custom: CustomPage[] = Array.isArray(rawPages.custom)
    ? rawPages.custom
        .map((raw): CustomPage | null => {
          const p = obj(raw);
          const id = str(p.id);
          if (!/^[a-z0-9-]{1,30}$/.test(id)) return null;
          return { id, title: str(p.title, id), showInNav: bool(p.showInNav, true), sections: normalizeList(p.sections) };
        })
        .filter((p): p is CustomPage => p !== null)
        .slice(0, MAX_CUSTOM_PAGES)
    : [];
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
    pages: {
      home: { sections },
      product: {
        layout: oneOf(product.layout, ['split', 'stacked'] as const, 'split'),
        imageRatio: oneOf(product.imageRatio, ['square', 'portrait', 'wide'] as const, 'square'),
      },
      cart: { style: oneOf(cart.style, ['page', 'drawer'] as const, 'page'), message: str(cart.message) },
      custom,
    },
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
