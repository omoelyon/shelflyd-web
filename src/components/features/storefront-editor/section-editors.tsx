'use client';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { LIMITS } from '@/lib/storefront/editor-model';
import type {
  AboutSection,
  AnnouncementSection,
  CategoriesSection,
  CtaSection,
  FaqSection,
  FeaturedSection,
  GallerySection,
  HeroSection,
  ImageTextSection,
  InfoSection,
  ProductsSection,
  SocialsSection,
  StorefrontSection,
  TestimonialsSection,
} from '@/lib/storefront/design';
import { Field, Segmented, ToggleRow } from './controls';
import ImageField from './image-field';
import ProductPicker from './product-picker';
import Repeater from './repeater';

const count = (v: string, max: number) => `${v.length}/${max}`;

interface EditorProps<T extends StorefrontSection> {
  section: T;
  onChange: (section: StorefrontSection) => void;
}

function Announcement({ section, onChange }: EditorProps<AnnouncementSection>) {
  const { props } = section;
  const set = (patch: Partial<typeof props>) => onChange({ ...section, props: { ...props, ...patch } });
  return (
    <div className="space-y-3">
      <Field label="Message" counter={count(props.text, LIMITS.announcementText)}>
        {(id) => <Input id={id} value={props.text} maxLength={LIMITS.announcementText} onChange={(e) => set({ text: e.target.value })} placeholder="Free delivery on orders over ₦20,000" />}
      </Field>
      <Field label="Link (optional)" hint="Starts with https:// or /. Shoppers can tap the bar to open it.">
        {(id) => <Input id={id} value={props.link} onChange={(e) => set({ link: e.target.value })} placeholder="https://" inputMode="url" />}
      </Field>
    </div>
  );
}

function Hero({ section, onChange }: EditorProps<HeroSection>) {
  const { props } = section;
  const set = (patch: Partial<typeof props>) => onChange({ ...section, props: { ...props, ...patch } });
  return (
    <div className="space-y-3">
      <Field label="Style">
        <Segmented
          label="Hero style"
          value={section.variant}
          onChange={(variant) => onChange({ ...section, variant })}
          options={[
            { value: 'tinted', label: 'Soft card', hint: 'A tinted card with your name' },
            { value: 'banner', label: 'Full banner', hint: 'Edge to edge, with a photo or your colour' },
          ]}
        />
      </Field>
      <Field label="Heading" hint="Leave empty to use your business name." counter={count(props.heading, LIMITS.heroHeading)}>
        {(id) => <Input id={id} value={props.heading} maxLength={LIMITS.heroHeading} onChange={(e) => set({ heading: e.target.value })} />}
      </Field>
      <Field label="Tagline" hint="Leave empty to use your business description." counter={count(props.tagline, LIMITS.heroTagline)}>
        {(id) => <Textarea id={id} rows={2} value={props.tagline} maxLength={LIMITS.heroTagline} onChange={(e) => set({ tagline: e.target.value })} />}
      </Field>
      {section.variant === 'banner' && <ImageField label="Banner photo" value={props.image} onChange={(image) => set({ image })} emptyHint="Without a photo the banner uses your brand colour." />}
      <Field label="Location (optional)" counter={count(props.location, LIMITS.heroLocation)}>
        {(id) => <Input id={id} value={props.location} maxLength={LIMITS.heroLocation} onChange={(e) => set({ location: e.target.value })} placeholder="Yaba, Lagos" />}
      </Field>
      <ToggleRow
        label="Show “Open” badge"
        control={<Switch aria-label="Show Open badge" checked={props.showOpenBadge} onCheckedChange={(showOpenBadge) => set({ showOpenBadge })} />}
      />
    </div>
  );
}

function Products({ section, onChange }: EditorProps<ProductsSection>) {
  const { props } = section;
  const set = (patch: Partial<typeof props>) => onChange({ ...section, props: { ...props, ...patch } });
  return (
    <div className="space-y-3">
      <Field label="Look">
        <Segmented
          label="Products look"
          value={section.variant}
          onChange={(variant) => onChange({ ...section, variant })}
          options={[
            { value: 'grid', label: 'Cards', hint: 'Photo, description and price' },
            { value: 'portrait', label: 'Portrait', hint: 'Tall photos, name and price' },
            { value: 'compact', label: 'Compact', hint: 'Small cards for big catalogues' },
          ]}
        />
      </Field>
      <Field label="Section title" counter={count(props.title, LIMITS.productsTitle)}>
        {(id) => <Input id={id} value={props.title} maxLength={LIMITS.productsTitle} onChange={(e) => set({ title: e.target.value })} />}
      </Field>
      <Field label="Columns on large screens">
        <Segmented
          label="Columns"
          value={props.columns}
          onChange={(columns) => set({ columns })}
          options={[
            { value: 3, label: '3' },
            { value: 4, label: '4' },
          ]}
        />
      </Field>
      <ToggleRow
        label="Show search box"
        control={<Switch aria-label="Show search box" checked={props.showSearch} onCheckedChange={(showSearch) => set({ showSearch })} />}
      />
      <ToggleRow
        label="Show “Build a set” row"
        hint="Lets shoppers order the same combo several times."
        control={<Switch aria-label="Show Build a set row" checked={props.showSets} onCheckedChange={(showSets) => set({ showSets })} />}
      />
    </div>
  );
}

function About({ section, onChange }: EditorProps<AboutSection>) {
  const { props } = section;
  const set = (patch: Partial<typeof props>) => onChange({ ...section, props: { ...props, ...patch } });
  return (
    <div className="space-y-3">
      <Field label="Title" counter={count(props.title, LIMITS.aboutTitle)}>
        {(id) => <Input id={id} value={props.title} maxLength={LIMITS.aboutTitle} onChange={(e) => set({ title: e.target.value })} />}
      </Field>
      <Field label="Text" counter={count(props.body, LIMITS.aboutBody)}>
        {(id) => <Textarea id={id} rows={5} value={props.body} maxLength={LIMITS.aboutBody} onChange={(e) => set({ body: e.target.value })} />}
      </Field>
    </div>
  );
}

function Info({ section, onChange }: EditorProps<InfoSection>) {
  const { props } = section;
  const set = (patch: Partial<typeof props>) => onChange({ ...section, props: { ...props, ...patch } });
  return (
    <div className="space-y-3">
      <Field label="Address" counter={count(props.address, LIMITS.infoAddress)}>
        {(id) => <Input id={id} value={props.address} maxLength={LIMITS.infoAddress} onChange={(e) => set({ address: e.target.value })} />}
      </Field>
      <Field label="Opening hours" hint="One line per day or range." counter={count(props.hours, LIMITS.infoHours)}>
        {(id) => (
          <Textarea id={id} rows={3} value={props.hours} maxLength={LIMITS.infoHours} onChange={(e) => set({ hours: e.target.value })} placeholder={'Mon–Fri 8am–6pm\nSat 9am–3pm'} />
        )}
      </Field>
      <Field label="Phone" counter={count(props.phone, LIMITS.infoPhone)}>
        {(id) => <Input id={id} type="tel" value={props.phone} maxLength={LIMITS.infoPhone} onChange={(e) => set({ phone: e.target.value })} />}
      </Field>
      <Field label="Email" counter={count(props.email, LIMITS.infoEmail)}>
        {(id) => <Input id={id} type="email" value={props.email} maxLength={LIMITS.infoEmail} onChange={(e) => set({ email: e.target.value })} />}
      </Field>
    </div>
  );
}

const LOOKS = [
  { value: 'grid', label: 'Cards', hint: 'Photo, description and price' },
  { value: 'portrait', label: 'Portrait', hint: 'Tall photos, name and price' },
  { value: 'compact', label: 'Compact', hint: 'Small cards for big catalogues' },
] as const;

function Featured({ section, onChange }: EditorProps<FeaturedSection>) {
  const { props } = section;
  const set = (patch: Partial<typeof props>) => onChange({ ...section, props: { ...props, ...patch } });
  return (
    <div className="space-y-3">
      <Field label="Section title" counter={count(props.title, LIMITS.sectionTitle)}>
        {(id) => <Input id={id} value={props.title} maxLength={LIMITS.sectionTitle} onChange={(e) => set({ title: e.target.value })} />}
      </Field>
      <Field label="Look">
        <Segmented label="Featured products look" value={section.variant} onChange={(variant) => onChange({ ...section, variant })} options={[...LOOKS]} />
      </Field>
      <Field label="Columns on large screens">
        <Segmented
          label="Columns"
          value={props.columns}
          onChange={(columns) => set({ columns })}
          options={[
            { value: 3, label: '3' },
            { value: 4, label: '4' },
          ]}
        />
      </Field>
      <ProductPicker value={props.productIds} onChange={(productIds) => set({ productIds })} max={LIMITS.featuredProducts} />
    </div>
  );
}

function Categories({ section, onChange, pageHasProducts }: EditorProps<CategoriesSection> & { pageHasProducts: boolean }) {
  const { props } = section;
  const set = (patch: Partial<typeof props>) => onChange({ ...section, props: { ...props, ...patch } });
  return (
    <div className="space-y-3">
      {!pageHasProducts && (
        <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
          Category chips filter the products on the same page, and this page has no products section. Add a Products section or delete these chips, or saving will be refused.
        </p>
      )}
      <Field label="Title (optional)" counter={count(props.title, LIMITS.sectionTitle)}>
        {(id) => <Input id={id} value={props.title} maxLength={LIMITS.sectionTitle} onChange={(e) => set({ title: e.target.value })} />}
      </Field>
      <ToggleRow
        label="Show an “All” chip"
        hint="Lets shoppers clear the filter."
        control={<Switch aria-label="Show All chip" checked={props.showAll} onCheckedChange={(showAll) => set({ showAll })} />}
      />
      <p className="text-xs text-muted-foreground">The chips come from the categories your products use. They are hidden until at least one product has a category.</p>
    </div>
  );
}

function ImageText({ section, onChange }: EditorProps<ImageTextSection>) {
  const { props } = section;
  const set = (patch: Partial<typeof props>) => onChange({ ...section, props: { ...props, ...patch } });
  return (
    <div className="space-y-3">
      <Field label="Photo position">
        <Segmented
          label="Photo position"
          value={section.variant}
          onChange={(variant) => onChange({ ...section, variant })}
          options={[
            { value: 'left', label: 'Photo left' },
            { value: 'right', label: 'Photo right' },
          ]}
        />
      </Field>
      <ImageField label="Photo" value={props.image} onChange={(image) => set({ image })} emptyHint="Without a photo the text takes the full width." />
      <Field label="Heading" counter={count(props.heading, LIMITS.imageTextHeading)}>
        {(id) => <Input id={id} value={props.heading} maxLength={LIMITS.imageTextHeading} onChange={(e) => set({ heading: e.target.value })} />}
      </Field>
      <Field label="Text" counter={count(props.body, LIMITS.imageTextBody)}>
        {(id) => <Textarea id={id} rows={4} value={props.body} maxLength={LIMITS.imageTextBody} onChange={(e) => set({ body: e.target.value })} />}
      </Field>
      <Field label="Button label (optional)" counter={count(props.buttonLabel, LIMITS.buttonLabel)}>
        {(id) => <Input id={id} value={props.buttonLabel} maxLength={LIMITS.buttonLabel} onChange={(e) => set({ buttonLabel: e.target.value })} placeholder="Shop now" />}
      </Field>
      <Field label="Button link" hint="Starts with https:// or /. Needed if the button has a label.">
        {(id) => <Input id={id} value={props.buttonLink} onChange={(e) => set({ buttonLink: e.target.value })} placeholder="https://" inputMode="url" />}
      </Field>
    </div>
  );
}

function Gallery({ section, onChange }: EditorProps<GallerySection>) {
  const { props } = section;
  const set = (patch: Partial<typeof props>) => onChange({ ...section, props: { ...props, ...patch } });
  return (
    <div className="space-y-3">
      <Field label="Title (optional)" counter={count(props.title, LIMITS.sectionTitle)}>
        {(id) => <Input id={id} value={props.title} maxLength={LIMITS.sectionTitle} onChange={(e) => set({ title: e.target.value })} />}
      </Field>
      <Repeater items={props.images} onChange={(images) => set({ images })} max={LIMITS.galleryImages} create={() => ({ url: '', caption: '' })} noun="Photo">
        {(item, update, index) => (
          <div className="space-y-3">
            <ImageField label={`Photo ${index + 1}`} value={item.url} onChange={(url) => update({ url })} emptyHint="Photos without an image are left out when you save." />
            <Field label="Caption (optional)" counter={count(item.caption, LIMITS.galleryCaption)}>
              {(id) => <Input id={id} value={item.caption} maxLength={LIMITS.galleryCaption} onChange={(e) => update({ caption: e.target.value })} />}
            </Field>
          </div>
        )}
      </Repeater>
    </div>
  );
}

function Faq({ section, onChange }: EditorProps<FaqSection>) {
  const { props } = section;
  const set = (patch: Partial<typeof props>) => onChange({ ...section, props: { ...props, ...patch } });
  return (
    <div className="space-y-3">
      <Field label="Title" counter={count(props.title, LIMITS.sectionTitle)}>
        {(id) => <Input id={id} value={props.title} maxLength={LIMITS.sectionTitle} onChange={(e) => set({ title: e.target.value })} />}
      </Field>
      <Repeater items={props.items} onChange={(items) => set({ items })} max={LIMITS.faqItems} create={() => ({ question: '', answer: '' })} noun="Question">
        {(item, update) => (
          <div className="space-y-3">
            <Field label="Question" counter={count(item.question, LIMITS.faqQuestion)}>
              {(id) => <Input id={id} value={item.question} maxLength={LIMITS.faqQuestion} onChange={(e) => update({ question: e.target.value })} />}
            </Field>
            <Field label="Answer" counter={count(item.answer, LIMITS.faqAnswer)}>
              {(id) => <Textarea id={id} rows={3} value={item.answer} maxLength={LIMITS.faqAnswer} onChange={(e) => update({ answer: e.target.value })} />}
            </Field>
          </div>
        )}
      </Repeater>
      <p className="text-xs text-muted-foreground">Questions left empty are removed when you save.</p>
    </div>
  );
}

function Testimonials({ section, onChange }: EditorProps<TestimonialsSection>) {
  const { props } = section;
  const set = (patch: Partial<typeof props>) => onChange({ ...section, props: { ...props, ...patch } });
  return (
    <div className="space-y-3">
      <Field label="Title" counter={count(props.title, LIMITS.sectionTitle)}>
        {(id) => <Input id={id} value={props.title} maxLength={LIMITS.sectionTitle} onChange={(e) => set({ title: e.target.value })} />}
      </Field>
      <Repeater items={props.items} onChange={(items) => set({ items })} max={LIMITS.testimonialItems} create={() => ({ quote: '', name: '' })} noun="Review">
        {(item, update) => (
          <div className="space-y-3">
            <Field label="What they said" counter={count(item.quote, LIMITS.testimonialQuote)}>
              {(id) => <Textarea id={id} rows={3} value={item.quote} maxLength={LIMITS.testimonialQuote} onChange={(e) => update({ quote: e.target.value })} />}
            </Field>
            <Field label="Name" counter={count(item.name, LIMITS.testimonialName)}>
              {(id) => <Input id={id} value={item.name} maxLength={LIMITS.testimonialName} onChange={(e) => update({ name: e.target.value })} placeholder="Ada O., Lagos" />}
            </Field>
          </div>
        )}
      </Repeater>
      <p className="text-xs text-muted-foreground">Only add real reviews from your customers. Empty ones are removed when you save.</p>
    </div>
  );
}

function Cta({ section, onChange }: EditorProps<CtaSection>) {
  const { props } = section;
  const set = (patch: Partial<typeof props>) => onChange({ ...section, props: { ...props, ...patch } });
  return (
    <div className="space-y-3">
      <Field label="Heading" counter={count(props.heading, LIMITS.ctaHeading)}>
        {(id) => <Input id={id} value={props.heading} maxLength={LIMITS.ctaHeading} onChange={(e) => set({ heading: e.target.value })} />}
      </Field>
      <Field label="Text" counter={count(props.text, LIMITS.ctaText)}>
        {(id) => <Textarea id={id} rows={2} value={props.text} maxLength={LIMITS.ctaText} onChange={(e) => set({ text: e.target.value })} />}
      </Field>
      <Field label="Button label" counter={count(props.buttonLabel, LIMITS.buttonLabel)}>
        {(id) => <Input id={id} value={props.buttonLabel} maxLength={LIMITS.buttonLabel} onChange={(e) => set({ buttonLabel: e.target.value })} placeholder="Shop now" />}
      </Field>
      <Field label="Button link" hint="Starts with https:// or /. Needed if the button has a label.">
        {(id) => <Input id={id} value={props.buttonLink} onChange={(e) => set({ buttonLink: e.target.value })} placeholder="/" inputMode="url" />}
      </Field>
    </div>
  );
}

const SOCIALS: { key: 'instagram' | 'facebook' | 'tiktok' | 'x' | 'youtube'; label: string; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourshop' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourshop' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourshop' },
  { key: 'x', label: 'X', placeholder: 'https://x.com/yourshop' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourshop' },
];

function Socials({ section, onChange }: EditorProps<SocialsSection>) {
  const { props } = section;
  const set = (patch: Partial<typeof props>) => onChange({ ...section, props: { ...props, ...patch } });
  return (
    <div className="space-y-3">
      <Field label="Title (optional)" counter={count(props.title, LIMITS.sectionTitle)}>
        {(id) => <Input id={id} value={props.title} maxLength={LIMITS.sectionTitle} onChange={(e) => set({ title: e.target.value })} />}
      </Field>
      {SOCIALS.map((n) => (
        <Field key={n.key} label={n.label} hint={n.key === 'instagram' ? 'Paste the full address, starting with https://. Leave empty to skip a network.' : undefined}>
          {(id) => <Input id={id} value={props[n.key]} maxLength={LIMITS.socialUrl} onChange={(e) => set({ [n.key]: e.target.value })} placeholder={n.placeholder} inputMode="url" />}
        </Field>
      ))}
    </div>
  );
}

/** The fields for one section, chosen by its type. `pageHasProducts` tells the chips editor whether it has something to filter. */
export default function SectionEditor({ section, onChange, pageHasProducts = true }: EditorProps<StorefrontSection> & { pageHasProducts?: boolean }) {
  switch (section.type) {
    case 'announcement':
      return <Announcement section={section} onChange={onChange} />;
    case 'hero':
      return <Hero section={section} onChange={onChange} />;
    case 'products':
      return <Products section={section} onChange={onChange} />;
    case 'about':
      return <About section={section} onChange={onChange} />;
    case 'info':
      return <Info section={section} onChange={onChange} />;
    case 'featured':
      return <Featured section={section} onChange={onChange} />;
    case 'categories':
      return <Categories section={section} onChange={onChange} pageHasProducts={pageHasProducts} />;
    case 'imageText':
      return <ImageText section={section} onChange={onChange} />;
    case 'gallery':
      return <Gallery section={section} onChange={onChange} />;
    case 'faq':
      return <Faq section={section} onChange={onChange} />;
    case 'testimonials':
      return <Testimonials section={section} onChange={onChange} />;
    case 'cta':
      return <Cta section={section} onChange={onChange} />;
    case 'socials':
      return <Socials section={section} onChange={onChange} />;
  }
}
