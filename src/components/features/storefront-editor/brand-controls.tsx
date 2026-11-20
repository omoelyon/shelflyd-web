'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { contrastWithWhite, parseHex } from '@/lib/storefront/editor-model';
import { FONT_STACKS, readableTextOn, type FontKey, type StorefrontDesign } from '@/lib/storefront/design';
import { cn } from '@/lib/utils';
import { Field, Panel, Segmented, ToggleRow } from './controls';

const SWATCHES = ['#16a34a', '#0058be', '#c2410c', '#7c3aed', '#be185d', '#0f766e', '#b45309', '#1c1917'];

const FONT_OPTIONS: { value: FontKey; label: string }[] = [
  { value: 'manrope', label: 'Manrope' },
  { value: 'inter', label: 'Inter' },
  { value: 'serif', label: 'Serif' },
];

const fontOptions = FONT_OPTIONS.map((f) => ({
  value: f.value,
  label: f.label,
  render: (
    <span className="block" style={{ fontFamily: FONT_STACKS[f.value] }}>
      <span className="block text-base leading-none">Aa</span>
      <span className="mt-1 block text-[11px]">{f.label}</span>
    </span>
  ),
}));

interface Props {
  design: StorefrontDesign;
  onChange: (design: StorefrontDesign) => void;
}

/** Colour, corners, fonts, header and footer. */
export default function BrandControls({ design, onChange }: Props) {
  const { theme, header, footer } = design;
  const [hexDraft, setHexDraft] = useState<string | null>(null);

  const setTheme = (patch: Partial<StorefrontDesign['theme']>) => onChange({ ...design, theme: { ...theme, ...patch } });
  const setColor = (hex: string) => {
    setHexDraft(null);
    setTheme({ primary: hex });
  };

  const onHexInput = (value: string) => {
    setHexDraft(value);
    const parsed = parseHex(value);
    if (parsed) setTheme({ primary: parsed });
  };

  const contrast = contrastWithWhite(theme.primary);
  const textOn = readableTextOn(theme.primary) === '#ffffff' ? 'white' : 'dark';

  return (
    <Panel title="Brand" description="Your colour, fonts and the frame around every page.">
      <div className="space-y-2">
        <Field label="Brand colour">
          {(id) => (
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick a brand colour"
                value={theme.primary}
                onChange={(e) => setColor(e.target.value.toLowerCase())}
                className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border bg-transparent p-0.5"
              />
              <Input
                id={id}
                value={hexDraft ?? theme.primary}
                onChange={(e) => onHexInput(e.target.value)}
                onBlur={() => setHexDraft(null)}
                maxLength={7}
                spellCheck={false}
                aria-invalid={hexDraft !== null && !parseHex(hexDraft)}
                className="font-mono"
              />
            </div>
          )}
        </Field>
        <div role="group" aria-label="Suggested colours" className="flex flex-wrap gap-2">
          {SWATCHES.map((hex) => (
            <button
              key={hex}
              type="button"
              aria-label={`Use ${hex}`}
              aria-pressed={theme.primary.toLowerCase() === hex}
              onClick={() => setColor(hex)}
              className={cn(
                'h-7 w-7 rounded-full border-2 outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50',
                theme.primary.toLowerCase() === hex ? 'scale-110 border-foreground' : 'border-white shadow-sm hover:scale-105',
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-2.5">
          <span
            className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium"
            style={{ backgroundColor: theme.primary, color: readableTextOn(theme.primary) }}
          >
            Add to cart
          </span>
          <p className="text-xs text-muted-foreground">
            Text on your colour is {textOn}, picked automatically so buttons stay readable.
            {contrast < 3 && <span className="mt-0.5 block text-amber-700">This colour is quite light. Prices and links in it may be hard to read on white.</span>}
          </p>
        </div>
      </div>

      <Field label="Corners">
        <Segmented
          label="Corner style"
          value={theme.radius}
          onChange={(radius) => setTheme({ radius })}
          options={[
            { value: 'sharp', label: 'Sharp', hint: 'Square corners' },
            { value: 'soft', label: 'Soft', hint: 'Gently rounded' },
            { value: 'round', label: 'Round', hint: 'Very rounded' },
          ]}
        />
      </Field>

      <Field label="Heading font">
        <Segmented label="Heading font" value={theme.headingFont} onChange={(headingFont) => setTheme({ headingFont })} options={fontOptions} />
      </Field>
      <Field label="Body font">
        <Segmented label="Body font" value={theme.bodyFont} onChange={(bodyFont) => setTheme({ bodyFont })} options={fontOptions} />
      </Field>

      <Field label="Header">
        <Segmented
          label="Header style"
          value={header.variant}
          onChange={(variant) => onChange({ ...design, header: { ...header, variant } })}
          options={[
            { value: 'classic', label: 'Classic', hint: 'Name on the left, cart on the right' },
            { value: 'centered', label: 'Centred', hint: 'Name in the middle' },
          ]}
        />
      </Field>
      <ToggleRow
        label="Keep header visible while scrolling"
        control={
          <Switch
            aria-label="Keep header visible while scrolling"
            checked={header.sticky}
            onCheckedChange={(sticky) => onChange({ ...design, header: { ...header, sticky } })}
          />
        }
      />

      <Field label="Footer" hint="“Powered by Shelflyd” always stays in the footer.">
        {() => (
          <Segmented
            label="Footer style"
            value={footer.variant}
            onChange={(variant) => onChange({ ...design, footer: { variant } })}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
            ]}
          />
        )}
      </Field>
    </Panel>
  );
}
