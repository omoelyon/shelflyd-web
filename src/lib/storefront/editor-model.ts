import {
  normalizeDesign,
  type AboutSection,
  type AnnouncementSection,
  type HeroSection,
  type InfoSection,
  type ProductsSection,
  type SectionType,
  type StorefrontDesign,
  type StorefrontSection,
} from './design';

/**
 * Pure editing logic for the storefront editor: building sections, changing their order, checking a design
 * before it is sent, and comparing designs. No React in here so it is easy to test. The rules in
 * `clientValidate` mirror the backend's StorefrontDesignValidator — the server stays the authority.
 */

export const MAX_SECTIONS = 20;

/** How many of each section type one page may hold (same limits as the server). */
export const MAX_PER_TYPE: Record<SectionType, number> = { announcement: 1, hero: 1, products: 1, about: 3, info: 1 };

export const SECTION_LABEL: Record<SectionType, string> = {
  announcement: 'Announcement bar',
  hero: 'Hero banner',
  products: 'Products',
  about: 'About us',
  info: 'Contact and hours',
};

export const SECTION_BLURB: Record<SectionType, string> = {
  announcement: 'A slim strip at the top for offers or delivery news.',
  hero: 'The big welcome: your name, a line about you and a photo.',
  products: 'Your products, with search.',
  about: 'A few words about your business.',
  info: 'Address, opening hours and how to reach you.',
};

/** Text limits (characters), identical to the server's. */
export const LIMITS = {
  announcementText: 160,
  heroHeading: 80,
  heroTagline: 200,
  heroLocation: 120,
  productsTitle: 60,
  aboutTitle: 60,
  aboutBody: 2000,
  infoAddress: 200,
  infoHours: 400,
  infoPhone: 30,
  infoEmail: 120,
} as const;

const uid = () => Math.random().toString(36).slice(2, 8);

export function newSection(type: SectionType): StorefrontSection {
  const id = `${type}-${uid()}`;
  switch (type) {
    case 'announcement': {
      const s: AnnouncementSection = { id, type, variant: 'bar', props: { text: 'Welcome! Order online today.', link: '' } };
      return s;
    }
    case 'hero': {
      const s: HeroSection = {
        id,
        type,
        variant: 'tinted',
        props: { heading: '', tagline: '', image: '', showOpenBadge: true, location: '' },
      };
      return s;
    }
    case 'products': {
      const s: ProductsSection = {
        id,
        type,
        variant: 'grid',
        props: { title: 'Products', columns: 4, showSearch: true, showSets: true },
      };
      return s;
    }
    case 'about': {
      const s: AboutSection = { id, type, variant: 'plain', props: { title: 'About us', body: 'Tell shoppers a little about your business.' } };
      return s;
    }
    default: {
      const s: InfoSection = { id, type: 'info', variant: 'strip', props: { address: '', hours: '', phone: '', email: '' } };
      return s;
    }
  }
}

export const sectionsOf = (d: StorefrontDesign): StorefrontSection[] => d.pages.home.sections;

const withSections = (d: StorefrontDesign, sections: StorefrontSection[]): StorefrontDesign => ({
  ...d,
  pages: { ...d.pages, home: { ...d.pages.home, sections } },
});

export function countOfType(d: StorefrontDesign, type: SectionType): number {
  return sectionsOf(d).filter((s) => s.type === type).length;
}

/** Section types that can still be added (under their per-type limit and the page limit). */
export function addableTypes(d: StorefrontDesign): SectionType[] {
  if (sectionsOf(d).length >= MAX_SECTIONS) return [];
  return (Object.keys(MAX_PER_TYPE) as SectionType[]).filter((t) => countOfType(d, t) < MAX_PER_TYPE[t]);
}

/**
 * Adds a section where it usually belongs: the announcement on top, the hero below it, everything else at the end.
 * Returns the new design and the new section's id.
 */
export function addSection(d: StorefrontDesign, type: SectionType): { design: StorefrontDesign; id: string } {
  const list = sectionsOf(d);
  const section = newSection(type);
  let index = list.length;
  if (type === 'announcement') index = 0;
  if (type === 'hero') index = list[0]?.type === 'announcement' ? 1 : 0;
  const next = [...list.slice(0, index), section, ...list.slice(index)];
  return { design: withSections(d, next), id: section.id };
}

export function removeSection(d: StorefrontDesign, id: string): StorefrontDesign {
  return withSections(d, sectionsOf(d).filter((s) => s.id !== id));
}

export function moveSection(d: StorefrontDesign, id: string, direction: -1 | 1): StorefrontDesign {
  const list = [...sectionsOf(d)];
  const from = list.findIndex((s) => s.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= list.length) return d;
  [list[from], list[to]] = [list[to], list[from]];
  return withSections(d, list);
}

export function setHidden(d: StorefrontDesign, id: string, hidden: boolean): StorefrontDesign {
  return withSections(d, sectionsOf(d).map((s) => (s.id === id ? ({ ...s, hidden: hidden || undefined } as StorefrontSection) : s)));
}

/** Replaces one section with `fn(section)`. */
export function mapSection(d: StorefrontDesign, id: string, fn: (s: StorefrontSection) => StorefrontSection): StorefrontDesign {
  return withSections(d, sectionsOf(d).map((s) => (s.id === id ? fn(s) : s)));
}

/** A short line describing a section in the list ("Banner · Fresh bakes daily"). */
export function sectionSummary(s: StorefrontSection): string {
  switch (s.type) {
    case 'announcement':
      return s.props.text.trim() || 'No text yet';
    case 'hero':
      return `${s.variant === 'banner' ? 'Banner' : 'Card'}${s.props.heading.trim() ? ` · ${s.props.heading.trim()}` : ''}`;
    case 'products': {
      const look = { grid: 'Cards', portrait: 'Portrait photos', compact: 'Compact' }[s.variant];
      return `${look} · ${s.props.columns} columns`;
    }
    case 'about':
      return s.props.title.trim() || 'About us';
    case 'info': {
      const filled = [s.props.address, s.props.hours, s.props.phone, s.props.email].filter((v) => v.trim()).length;
      return filled ? `${filled} detail${filled === 1 ? '' : 's'} filled in` : 'Add your address, hours or phone';
    }
  }
}

// ─── Checking a design before it is sent ─────────────────────────────────────

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Empty, a path on this site, or an https link (never javascript:, data: or http:). */
export function isSafeLink(v: string): boolean {
  const t = v.trim();
  if (!t) return true;
  if (/\s/.test(t) || t.length > 500) return false;
  return t.startsWith('https://') || (t.startsWith('/') && !t.startsWith('//'));
}

/** The first problem the server would reject this design for, in plain words, or null when it looks fine. */
export function clientValidate(d: StorefrontDesign): string | null {
  if (!HEX.test(d.theme.primary)) return 'Brand colour must look like #16a34a.';
  const sections = sectionsOf(d);
  if (sections.length > MAX_SECTIONS) return `A page can have at most ${MAX_SECTIONS} sections.`;
  const ids = new Set<string>();
  const counts: Partial<Record<SectionType, number>> = {};
  for (const s of sections) {
    if (ids.has(s.id)) return 'Every section needs a unique id.';
    ids.add(s.id);
    counts[s.type] = (counts[s.type] ?? 0) + 1;
    if ((counts[s.type] ?? 0) > MAX_PER_TYPE[s.type]) return `You can only have ${MAX_PER_TYPE[s.type]} “${SECTION_LABEL[s.type]}” section${MAX_PER_TYPE[s.type] === 1 ? '' : 's'}.`;
  }
  if (!sections.some((s) => s.type === 'products' && !s.hidden)) return 'Your home page must show your products.';
  for (const s of sections) {
    const label = SECTION_LABEL[s.type];
    const tooLong = (text: string, max: number, field: string) =>
      text.trim().length > max ? `${label}: ${field} is too long (at most ${max} characters).` : null;
    let problem: string | null = null;
    switch (s.type) {
      case 'announcement':
        problem =
          tooLong(s.props.text, LIMITS.announcementText, 'the text') ??
          (isSafeLink(s.props.link) ? null : `${label}: the link must start with https:// or /.`);
        break;
      case 'hero':
        problem =
          tooLong(s.props.heading, LIMITS.heroHeading, 'the heading') ??
          tooLong(s.props.tagline, LIMITS.heroTagline, 'the tagline') ??
          tooLong(s.props.location, LIMITS.heroLocation, 'the location') ??
          (isSafeLink(s.props.image) ? null : `${label}: the image must be an https link.`);
        break;
      case 'products':
        problem = tooLong(s.props.title, LIMITS.productsTitle, 'the title');
        break;
      case 'about':
        problem = tooLong(s.props.title, LIMITS.aboutTitle, 'the title') ?? tooLong(s.props.body, LIMITS.aboutBody, 'the text');
        break;
      case 'info':
        problem =
          tooLong(s.props.address, LIMITS.infoAddress, 'the address') ??
          tooLong(s.props.hours, LIMITS.infoHours, 'the opening hours') ??
          tooLong(s.props.phone, LIMITS.infoPhone, 'the phone number') ??
          tooLong(s.props.email, LIMITS.infoEmail, 'the email');
        break;
    }
    if (problem) return problem;
  }
  return null;
}

// ─── Comparing ───────────────────────────────────────────────────────────────

/** True when two designs render identically (both are passed through the normaliser first, so key order and defaults don't matter). */
export function designsEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeDesign(a)) === JSON.stringify(normalizeDesign(b));
}

// ─── Colour help ─────────────────────────────────────────────────────────────

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of a colour against white (1 = identical, 21 = black). */
export function contrastWithWhite(hex: string): number {
  if (!HEX.test(hex)) return 21;
  return 1.05 / (luminance(hex) + 0.05);
}

/** Accepts "c2410c" or "#C2410C" and returns "#c2410c", or null when it isn't a six-digit colour. */
export function parseHex(input: string): string | null {
  const t = input.trim().replace(/^#?/, '#');
  return HEX.test(t) ? t.toLowerCase() : null;
}
