'use client';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { LIMITS } from '@/lib/storefront/editor-model';
import type {
  AboutSection,
  AnnouncementSection,
  HeroSection,
  InfoSection,
  ProductsSection,
  StorefrontSection,
} from '@/lib/storefront/design';
import { Field, Segmented, ToggleRow } from './controls';
import ImageField from './image-field';

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
      {section.variant === 'banner' && <ImageField label="Banner photo" value={props.image} onChange={(image) => set({ image })} />}
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

/** The fields for one section, chosen by its type. */
export default function SectionEditor({ section, onChange }: EditorProps<StorefrontSection>) {
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
  }
}
