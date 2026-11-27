import {
  MAX_CUSTOM_PAGES,
  normalizeDesign,
  sectionsForPage,
  type AboutSection,
  type AnnouncementSection,
  type CartSettings,
  type CategoriesSection,
  type CtaSection,
  type CustomPage,
  type FaqSection,
  type FeaturedSection,
  type GallerySection,
  type HeroSection,
  type ImageTextSection,
  type InfoSection,
  type PageKey,
  type ProductPageSettings,
  type ProductsSection,
  type SectionType,
  type SocialsSection,
  type StorefrontDesign,
  type StorefrontSection,
  type StorefrontSeo,
  type TestimonialsSection, PROMO_LIMITS, type StorefrontPromo } from './design';

/**
 * Pure editing logic for the storefront editor: building sections and pages, changing their order, checking a
 * design before it is sent, and comparing designs. No React in here so it is easy to test. The rules in
 * `clientValidate` mirror the backend's StorefrontDesignValidator — the server stays the authority.
 */

export const MAX_SECTIONS = 20;
export { MAX_CUSTOM_PAGES };

/** How many of each section type one page may hold (same limits as the server). */
export const MAX_PER_TYPE: Record<SectionType, number> = {
  announcement: 1,
  hero: 1,
  products: 1,
  about: 3,
  info: 1,
  featured: 2,
  categories: 1,
  imageText: 4,
  gallery: 2,
  faq: 1,
  testimonials: 1,
  cta: 3,
  socials: 1,
};

export const SECTION_LABEL: Record<SectionType, string> = {
  announcement: 'Announcement bar',
  hero: 'Hero banner',
  products: 'Products',
  about: 'About us',
  info: 'Contact and hours',
  featured: 'Featured products',
  categories: 'Category chips',
  imageText: 'Image and text',
  gallery: 'Photo gallery',
  faq: 'Questions and answers',
  testimonials: 'Customer reviews',
  cta: 'Call to action',
  socials: 'Social links',
};

export const SECTION_BLURB: Record<SectionType, string> = {
  announcement: 'A slim strip at the top for offers or delivery news.',
  hero: 'The big welcome: your name, a line about you and a photo.',
  products: 'Your products, with search.',
  about: 'A few words about your business.',
  info: 'Address, opening hours and how to reach you.',
  featured: 'Hand-pick the products you want to show off.',
  categories: 'Chips shoppers tap to filter your products by category.',
  imageText: 'A photo beside a heading, a few lines and a button.',
  gallery: 'A grid of your photos.',
  faq: 'Answer common questions about delivery, payment and more.',
  testimonials: 'Quotes from happy customers.',
  cta: 'A coloured band with a message and a button.',
  socials: 'Links to your Instagram, Facebook, TikTok, X or YouTube.',
};

/** Text limits (characters / counts), identical to the server's. */
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
  sectionTitle: 60,
  featuredProducts: 12,
  imageTextHeading: 80,
  imageTextBody: 600,
  buttonLabel: 30,
  galleryImages: 8,
  galleryCaption: 80,
  faqItems: 10,
  faqQuestion: 120,
  faqAnswer: 600,
  testimonialItems: 6,
  testimonialQuote: 300,
  testimonialName: 60,
  ctaHeading: 80,
  ctaText: 200,
  socialUrl: 200,
  pageTitle: 40,
  cartMessage: 160,
  seoTitle: 60,
  seoDescription: 160,
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
      const s: HeroSection = { id, type, variant: 'tinted', props: { heading: '', tagline: '', image: '', showOpenBadge: true, location: '' } };
      return s;
    }
    case 'products': {
      const s: ProductsSection = { id, type, variant: 'grid', props: { title: 'Products', columns: 4, showSearch: true, showSets: true } };
      return s;
    }
    case 'about': {
      const s: AboutSection = { id, type, variant: 'plain', props: { title: 'About us', body: 'Tell shoppers a little about your business.' } };
      return s;
    }
    case 'info': {
      const s: InfoSection = { id, type, variant: 'strip', props: { address: '', hours: '', phone: '', email: '' } };
      return s;
    }
    case 'featured': {
      const s: FeaturedSection = { id, type, variant: 'grid', props: { title: 'Our favourites', productIds: [], columns: 4 } };
      return s;
    }
    case 'categories': {
      const s: CategoriesSection = { id, type, variant: 'chips', props: { title: '', showAll: true } };
      return s;
    }
    case 'imageText': {
      const s: ImageTextSection = {
        id,
        type,
        variant: 'left',
        props: { heading: 'Made with care', body: 'Tell the story behind what you sell.', image: '', buttonLabel: '', buttonLink: '' },
      };
      return s;
    }
    case 'gallery': {
      const s: GallerySection = { id, type, variant: 'grid', props: { title: 'Gallery', images: [] } };
      return s;
    }
    case 'faq': {
      const s: FaqSection = {
        id,
        type,
        variant: 'list',
        props: { title: 'Questions', items: [{ question: 'How long does delivery take?', answer: 'Most orders arrive within a day or two.' }] },
      };
      return s;
    }
    case 'testimonials': {
      const s: TestimonialsSection = {
        id,
        type,
        variant: 'cards',
        props: { title: 'What customers say', items: [{ quote: 'Fresh, fast and exactly as described.', name: 'A happy customer' }] },
      };
      return s;
    }
    case 'cta': {
      const s: CtaSection = { id, type, variant: 'band', props: { heading: 'Ready to order?', text: 'Browse the menu and check out in a minute.', buttonLabel: 'Shop now', buttonLink: '/' } };
      return s;
    }
    case 'socials': {
      const s: SocialsSection = { id, type, variant: 'row', props: { title: 'Follow us', instagram: '', facebook: '', tiktok: '', x: '', youtube: '' } };
      return s;
    }
  }
}

// ─── Sections on a page ──────────────────────────────────────────────────────

export const sectionsOf = (d: StorefrontDesign, page: PageKey = 'home'): StorefrontSection[] => sectionsForPage(d, page);

/** Returns the design with `page`'s sections replaced (a no-op for a custom page that does not exist). */
export function withSections(d: StorefrontDesign, page: PageKey, sections: StorefrontSection[]): StorefrontDesign {
  if (page === 'home') return { ...d, pages: { ...d.pages, home: { ...d.pages.home, sections } } };
  return { ...d, pages: { ...d.pages, custom: d.pages.custom.map((p) => (`custom:${p.id}` === page ? { ...p, sections } : p)) } };
}

export function countOfType(d: StorefrontDesign, type: SectionType, page: PageKey = 'home'): number {
  return sectionsOf(d, page).filter((s) => s.type === type).length;
}

/** Section types that can still be added to a page (under their per-type limit and the page limit). */
export function addableTypes(d: StorefrontDesign, page: PageKey = 'home'): SectionType[] {
  if (sectionsOf(d, page).length >= MAX_SECTIONS) return [];
  return (Object.keys(MAX_PER_TYPE) as SectionType[]).filter((t) => countOfType(d, t, page) < MAX_PER_TYPE[t]);
}

/**
 * Adds a section where it usually belongs: the announcement on top, the hero below it, everything else at the end.
 * Returns the new design and the new section's id.
 */
export function addSection(d: StorefrontDesign, type: SectionType, page: PageKey = 'home'): { design: StorefrontDesign; id: string } {
  const list = sectionsOf(d, page);
  const section = newSection(type);
  let index = list.length;
  if (type === 'announcement') index = 0;
  if (type === 'hero') index = list[0]?.type === 'announcement' ? 1 : 0;
  const next = [...list.slice(0, index), section, ...list.slice(index)];
  return { design: withSections(d, page, next), id: section.id };
}

export function removeSection(d: StorefrontDesign, id: string, page: PageKey = 'home'): StorefrontDesign {
  return withSections(d, page, sectionsOf(d, page).filter((s) => s.id !== id));
}

export function moveSection(d: StorefrontDesign, id: string, direction: -1 | 1, page: PageKey = 'home'): StorefrontDesign {
  const list = [...sectionsOf(d, page)];
  const from = list.findIndex((s) => s.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= list.length) return d;
  [list[from], list[to]] = [list[to], list[from]];
  return withSections(d, page, list);
}

export function setHidden(d: StorefrontDesign, id: string, hidden: boolean, page: PageKey = 'home'): StorefrontDesign {
  return withSections(d, page, sectionsOf(d, page).map((s) => (s.id === id ? ({ ...s, hidden: hidden || undefined } as StorefrontSection) : s)));
}

/** Replaces one section with `fn(section)`. */
export function mapSection(d: StorefrontDesign, id: string, fn: (s: StorefrontSection) => StorefrontSection, page: PageKey = 'home'): StorefrontDesign {
  return withSections(d, page, sectionsOf(d, page).map((s) => (s.id === id ? fn(s) : s)));
}

/** True when a section can be deleted or hidden: the home page must keep its products. */
export function isRequiredSection(s: StorefrontSection, page: PageKey): boolean {
  return page === 'home' && s.type === 'products';
}

/** A short line describing a section in the list ("Banner · Fresh bakes daily"). */
export function sectionSummary(s: StorefrontSection): string {
  const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
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
    case 'featured':
      return s.props.productIds.length ? `${s.props.title.trim() || 'Featured'} · ${count(s.props.productIds.length, 'product')}` : 'Pick your products';
    case 'categories':
      return s.props.showAll ? 'Chips with "All"' : 'Chips';
    case 'imageText':
      return `${s.variant === 'left' ? 'Photo left' : 'Photo right'}${s.props.heading.trim() ? ` · ${s.props.heading.trim()}` : ''}`;
    case 'gallery':
      return s.props.images.length ? count(s.props.images.length, 'photo') : 'Add your photos';
    case 'faq':
      return count(s.props.items.length, 'question');
    case 'testimonials':
      return count(s.props.items.length, 'review');
    case 'cta':
      return s.props.heading.trim() || 'Add a message';
    case 'socials': {
      const n = [s.props.instagram, s.props.facebook, s.props.tiktok, s.props.x, s.props.youtube].filter((v) => v.trim()).length;
      return n ? count(n, 'link') : 'Add your profiles';
    }
  }
}

// ─── Pages ───────────────────────────────────────────────────────────────────

/** "Our Delivery Info!" → "our-delivery-info" (lower-case letters, digits and dashes; at most 30 characters). */
export function slugifyPageId(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/g, '');
}

export function customPage(d: StorefrontDesign, page: PageKey): CustomPage | undefined {
  return d.pages.custom.find((p) => `custom:${p.id}` === page);
}

export function pageTitle(d: StorefrontDesign, page: PageKey): string {
  return page === 'home' ? 'Home' : customPage(d, page)?.title ?? 'Page';
}

/** Adds an empty custom page; the id comes from the title and is made unique. Null when the page limit is reached. */
export function addCustomPage(d: StorefrontDesign, title: string): { design: StorefrontDesign; key: PageKey } | null {
  if (d.pages.custom.length >= MAX_CUSTOM_PAGES) return null;
  const clean = title.trim().slice(0, LIMITS.pageTitle) || 'New page';
  const base = slugifyPageId(clean) || 'page';
  const taken = new Set(d.pages.custom.map((p) => p.id));
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base.slice(0, 30 - String(n).length - 1)}-${n}`;
  const page: CustomPage = { id, title: clean, showInNav: true, sections: [newSection('about')] };
  return { design: { ...d, pages: { ...d.pages, custom: [...d.pages.custom, page] } }, key: `custom:${id}` };
}

export function updateCustomPage(d: StorefrontDesign, page: PageKey, patch: Partial<Pick<CustomPage, 'title' | 'showInNav'>>): StorefrontDesign {
  return { ...d, pages: { ...d.pages, custom: d.pages.custom.map((p) => (`custom:${p.id}` === page ? { ...p, ...patch } : p)) } };
}

export function removeCustomPage(d: StorefrontDesign, page: PageKey): StorefrontDesign {
  return { ...d, pages: { ...d.pages, custom: d.pages.custom.filter((p) => `custom:${p.id}` !== page) } };
}

export function setProductPage(d: StorefrontDesign, patch: Partial<ProductPageSettings>): StorefrontDesign {
  return { ...d, pages: { ...d.pages, product: { ...d.pages.product, ...patch } } };
}

export function setSeo(d: StorefrontDesign, patch: Partial<StorefrontSeo>): StorefrontDesign {
  return { ...d, seo: { ...d.seo, ...patch } };
}

export function setCart(d: StorefrontDesign, patch: Partial<CartSettings>): StorefrontDesign {
  return { ...d, pages: { ...d.pages, cart: { ...d.pages.cart, ...patch } } };
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

const tooLong = (where: string, text: string, max: number, field: string) =>
  text.trim().length > max ? `${where}: ${field} is too long (at most ${max} characters).` : null;

function sectionProblem(s: StorefrontSection, where: string): string | null {
  const t = (text: string, max: number, field: string) => tooLong(where, text, max, field);
  const link = (v: string, field: string) => (isSafeLink(v) ? null : `${where}: ${field} must start with https:// or /.`);
  switch (s.type) {
    case 'announcement':
      return t(s.props.text, LIMITS.announcementText, 'the text') ?? link(s.props.link, 'the link');
    case 'hero':
      return (
        t(s.props.heading, LIMITS.heroHeading, 'the heading') ??
        t(s.props.tagline, LIMITS.heroTagline, 'the tagline') ??
        t(s.props.location, LIMITS.heroLocation, 'the location') ??
        link(s.props.image, 'the image')
      );
    case 'products':
      return t(s.props.title, LIMITS.productsTitle, 'the title');
    case 'about':
      return t(s.props.title, LIMITS.aboutTitle, 'the title') ?? t(s.props.body, LIMITS.aboutBody, 'the text');
    case 'info':
      return (
        t(s.props.address, LIMITS.infoAddress, 'the address') ??
        t(s.props.hours, LIMITS.infoHours, 'the opening hours') ??
        t(s.props.phone, LIMITS.infoPhone, 'the phone number') ??
        t(s.props.email, LIMITS.infoEmail, 'the email')
      );
    case 'featured':
      if (s.props.productIds.length > LIMITS.featuredProducts) return `${where}: pick at most ${LIMITS.featuredProducts} products.`;
      return t(s.props.title, LIMITS.sectionTitle, 'the title');
    case 'categories':
      return t(s.props.title, LIMITS.sectionTitle, 'the title');
    case 'imageText':
      return (
        t(s.props.heading, LIMITS.imageTextHeading, 'the heading') ??
        t(s.props.body, LIMITS.imageTextBody, 'the text') ??
        t(s.props.buttonLabel, LIMITS.buttonLabel, 'the button label') ??
        link(s.props.image, 'the image') ??
        link(s.props.buttonLink, 'the button link') ??
        (s.props.buttonLabel.trim() && !s.props.buttonLink.trim() ? `${where}: the button needs a link.` : null)
      );
    case 'gallery': {
      if (s.props.images.length > LIMITS.galleryImages) return `${where}: at most ${LIMITS.galleryImages} photos.`;
      for (const i of s.props.images) {
        const p = link(i.url, 'a photo') ?? t(i.caption, LIMITS.galleryCaption, 'a caption');
        if (p) return p;
      }
      return t(s.props.title, LIMITS.sectionTitle, 'the title');
    }
    case 'faq': {
      if (s.props.items.length > LIMITS.faqItems) return `${where}: at most ${LIMITS.faqItems} questions.`;
      for (const i of s.props.items) {
        const p = t(i.question, LIMITS.faqQuestion, 'a question') ?? t(i.answer, LIMITS.faqAnswer, 'an answer');
        if (p) return p;
      }
      return t(s.props.title, LIMITS.sectionTitle, 'the title');
    }
    case 'testimonials': {
      if (s.props.items.length > LIMITS.testimonialItems) return `${where}: at most ${LIMITS.testimonialItems} reviews.`;
      for (const i of s.props.items) {
        const p = t(i.quote, LIMITS.testimonialQuote, 'a review') ?? t(i.name, LIMITS.testimonialName, 'a name');
        if (p) return p;
      }
      return t(s.props.title, LIMITS.sectionTitle, 'the title');
    }
    case 'cta':
      return (
        t(s.props.heading, LIMITS.ctaHeading, 'the heading') ??
        t(s.props.text, LIMITS.ctaText, 'the text') ??
        t(s.props.buttonLabel, LIMITS.buttonLabel, 'the button label') ??
        link(s.props.buttonLink, 'the button link') ??
        (s.props.buttonLabel.trim() && !s.props.buttonLink.trim() ? `${where}: the button needs a link.` : null)
      );
    case 'socials':
      for (const [name, url] of [['Instagram', s.props.instagram], ['Facebook', s.props.facebook], ['TikTok', s.props.tiktok], ['X', s.props.x], ['YouTube', s.props.youtube]] as const) {
        if (url.trim() && (!url.trim().startsWith('https://') || url.trim().length > LIMITS.socialUrl || /\s/.test(url.trim()))) {
          return `${where}: the ${name} link must be a full https:// address.`;
        }
      }
      return t(s.props.title, LIMITS.sectionTitle, 'the title');
  }
}

/** The first problem the server would reject one page's sections for, or null. */
export function validateSections(sections: StorefrontSection[], opts: { requireProducts: boolean; pageName: string }): string | null {
  if (sections.length > MAX_SECTIONS) return `${opts.pageName}: a page can have at most ${MAX_SECTIONS} sections.`;
  const ids = new Set<string>();
  const counts: Partial<Record<SectionType, number>> = {};
  for (const s of sections) {
    if (ids.has(s.id)) return `${opts.pageName}: every section needs a unique id.`;
    ids.add(s.id);
    counts[s.type] = (counts[s.type] ?? 0) + 1;
    if ((counts[s.type] ?? 0) > MAX_PER_TYPE[s.type]) {
      return `${opts.pageName}: you can only have ${MAX_PER_TYPE[s.type]} “${SECTION_LABEL[s.type]}” section${MAX_PER_TYPE[s.type] === 1 ? '' : 's'}.`;
    }
  }
  const hasProducts = sections.some((s) => s.type === 'products' && !s.hidden);
  if (opts.requireProducts && !hasProducts) return 'Your home page must show your products.';
  if (!hasProducts && sections.some((s) => s.type === 'categories')) {
    return `${opts.pageName}: category chips need a products section on the same page.`;
  }
  for (const s of sections) {
    const problem = sectionProblem(s, `${opts.pageName} › ${SECTION_LABEL[s.type]}`);
    if (problem) return problem;
  }
  return null;
}

/** The first problem the server would reject this design for, in plain words, or null when it looks fine. */
export function clientValidate(d: StorefrontDesign): string | null {
  if (!HEX.test(d.theme.primary)) return 'Brand colour must look like #16a34a.';
  const home = validateSections(d.pages.home.sections, { requireProducts: true, pageName: 'Home' });
  if (home) return home;
  if (d.pages.custom.length > MAX_CUSTOM_PAGES) return `You can have at most ${MAX_CUSTOM_PAGES} extra pages.`;
  const ids = new Set<string>();
  for (const p of d.pages.custom) {
    if (!/^[a-z0-9-]{1,30}$/.test(p.id) || ids.has(p.id)) return 'Every page needs its own short web address.';
    ids.add(p.id);
    if (!p.title.trim()) return 'Every page needs a title.';
    if (p.title.trim().length > LIMITS.pageTitle) return `A page title is too long (at most ${LIMITS.pageTitle} characters).`;
    const problem = validateSections(p.sections, { requireProducts: false, pageName: p.title.trim() });
    if (problem) return problem;
  }
  if (d.seo.title.trim().length > LIMITS.seoTitle) return `The search title is too long (at most ${LIMITS.seoTitle} characters).`;
  if (d.seo.description.trim().length > LIMITS.seoDescription) return `The search description is too long (at most ${LIMITS.seoDescription} characters).`;
  if (!isSafeLink(d.seo.image)) return 'The sharing picture must be an https link.';
  if (d.pages.cart.message.trim().length > LIMITS.cartMessage) return `The cart message is too long (at most ${LIMITS.cartMessage} characters).`;
  return promoProblem(d.promo);
}

/** The first problem with the promo popup the server would refuse, or null. Mirrors StorefrontDesignValidator. */
export function promoProblem(p: StorefrontPromo): string | null {
  if (p.heading.trim().length > PROMO_LIMITS.heading) return `The promo heading is too long (at most ${PROMO_LIMITS.heading} characters).`;
  if (p.body.trim().length > PROMO_LIMITS.body) return `The promo text is too long (at most ${PROMO_LIMITS.body} characters).`;
  if (p.buttonText.trim().length > PROMO_LIMITS.buttonText) return `The promo button text is too long (at most ${PROMO_LIMITS.buttonText} characters).`;
  if (p.code.trim() && !/^[A-Za-z0-9_-]{1,30}$/.test(p.code.trim())) return 'The promo code can only use letters, numbers, dashes and underscores (up to 30).';
  if (!isSafeLink(p.image)) return 'The promo picture must be an https link.';
  if (!isSafeLink(p.link)) return 'The promo button link must start with https:// or /.';
  if (p.startsAt && p.endsAt && p.endsAt < p.startsAt) return 'The promo ends before it starts.';
  if (p.enabled && !p.heading.trim() && !p.image.trim()) return 'Give the promo popup a heading or a picture before switching it on.';
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
