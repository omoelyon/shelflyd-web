'use client';

import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { StorefrontDesign } from '@/lib/storefront/design';
import { LIMITS, setSeo } from '@/lib/storefront/editor-model';
import { storefrontUrl } from '@/lib/storefront/url';
import { useStoreDomain } from '@/components/features/domains/use-store-domain';
import { Field, Panel } from './controls';
import ImageField from './image-field';

interface Props {
  design: StorefrontDesign;
  onChange: (design: StorefrontDesign) => void;
  slug: string;
  /** The business's own details, used wherever the seller leaves a field empty (same fallbacks the live page uses). */
  fallback: { name: string; description: string; logo: string | null };
}

/** How the store looks in search results and when its link is shared, with a live preview of both. */
export default function SeoControls({ design, onChange, slug, fallback }: Props) {
  const { seo } = design;
  const customDomain = useStoreDomain();
  const title = seo.title.trim() || fallback.name;
  const description = seo.description.trim() || fallback.description.trim();
  const image = seo.image.trim() || fallback.logo || '';
  const address = storefrontUrl(slug, '', customDomain).replace(/^https?:\/\//, '');
  const domain = address.split('/')[0];

  return (
    <Panel
      title="Search and sharing"
      description="What people see in Google results and when your store’s link is shared on WhatsApp, Instagram and other apps."
    >
      <Field label="Title" counter={`${seo.title.length}/${LIMITS.seoTitle}`} hint="Leave empty to use your business name.">
        {(id) => (
          <Input
            id={id}
            value={seo.title}
            maxLength={LIMITS.seoTitle}
            placeholder={fallback.name}
            onChange={(e) => onChange(setSeo(design, { title: e.target.value }))}
          />
        )}
      </Field>
      <Field label="Description" counter={`${seo.description.length}/${LIMITS.seoDescription}`} hint="One or two sentences about what you sell. Leave empty to use your business description.">
        {(id) => (
          <Textarea
            id={id}
            rows={3}
            value={seo.description}
            maxLength={LIMITS.seoDescription}
            placeholder={fallback.description}
            onChange={(e) => onChange(setSeo(design, { description: e.target.value }))}
          />
        )}
      </Field>
      <ImageField
        label="Sharing picture"
        value={seo.image}
        onChange={(url) => onChange(setSeo(design, { image: url }))}
        emptyHint="Leave empty to use your logo. A wide photo (about 1200×630) looks best."
      />

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">In Google</p>
        <div className="rounded-lg border bg-background p-3" aria-label="Preview of the Google search result">
          <p className="truncate text-xs text-[#188038]">{address}</p>
          <p className="truncate text-base leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{title || 'Your business name'}</p>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{description || 'Your description will appear here.'}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">When your link is shared</p>
        <div className="overflow-hidden rounded-lg border bg-background" aria-label="Preview of the shared link card">
          <div className="relative aspect-[1.91/1] w-full bg-muted">
            {image ? (
              <Image src={image} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No picture</div>
            )}
          </div>
          <div className="space-y-0.5 border-t bg-muted/40 p-2.5">
            <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">{domain}</p>
            <p className="line-clamp-1 text-sm font-semibold">{title || 'Your business name'}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{description || 'Your description will appear here.'}</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
