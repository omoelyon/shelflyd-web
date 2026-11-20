import type { CSSProperties } from 'react';
import { readableTextOn, type StorefrontDesign, type StorefrontSection } from '@/lib/storefront/design';

const CORNER: Record<StorefrontDesign['theme']['radius'], number> = { sharp: 0, soft: 3, round: 7 };

function Lines({ color, widths }: { color: string; widths: number[] }) {
  return (
    <div className="flex flex-col gap-[3px]">
      {widths.map((w, i) => (
        <div key={i} style={{ width: `${w}%`, height: 3, background: color, borderRadius: 2, opacity: 0.55 }} />
      ))}
    </div>
  );
}

function Block({ section, design }: { section: StorefrontSection; design: StorefrontDesign }) {
  const primary = design.theme.primary;
  const r = CORNER[design.theme.radius];
  const ink = '#94a3b8';
  const card: CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: r, overflow: 'hidden' };

  switch (section.type) {
    case 'announcement':
      return <div style={{ background: primary, height: 8 }} />;
    case 'hero':
      return section.variant === 'banner' ? (
        <div style={{ background: primary, height: 54, padding: 8, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 3 }}>
          <div style={{ width: '55%', height: 6, background: readableTextOn(primary), borderRadius: 2 }} />
          <div style={{ width: '35%', height: 3, background: readableTextOn(primary), borderRadius: 2, opacity: 0.7 }} />
        </div>
      ) : (
        <div style={{ margin: '6px 6px 0', background: `${primary}26`, borderRadius: r + 2, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ width: '50%', height: 6, background: '#0f172a', borderRadius: 2, opacity: 0.8 }} />
          <Lines color={ink} widths={[75, 50]} />
        </div>
      );
    case 'products': {
      const { variant } = section;
      const columns = variant === 'portrait' ? 3 : variant === 'compact' ? 5 : section.props.columns;
      const count = columns * (variant === 'portrait' ? 1 : 2);
      return (
        <div style={{ padding: '8px 6px 4px' }}>
          <div style={{ width: '30%', height: 5, background: '#0f172a', borderRadius: 2, opacity: 0.75, marginBottom: 5 }} />
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 4 }}>
            {Array.from({ length: count }).map((_, i) =>
              variant === 'portrait' ? (
                <div key={i} style={{ aspectRatio: '3 / 4', background: '#e2e8f0', borderRadius: r }} />
              ) : (
                <div key={i} style={card}>
                  <div style={{ aspectRatio: variant === 'compact' ? '1 / 1' : '4 / 3', background: '#e2e8f0' }} />
                  {variant === 'grid' && (
                    <div style={{ padding: 3 }}>
                      <div style={{ width: '70%', height: 3, background: primary, borderRadius: 2, opacity: 0.8 }} />
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      );
    }
    case 'about':
      return (
        <div style={{ padding: '6px 8px' }}>
          <div style={{ width: '28%', height: 5, background: '#0f172a', borderRadius: 2, opacity: 0.75, marginBottom: 4 }} />
          <Lines color={ink} widths={[90, 80, 60]} />
        </div>
      );
    case 'featured': {
      const columns = section.variant === 'portrait' ? 3 : section.variant === 'compact' ? 4 : section.props.columns;
      return (
        <div style={{ padding: '8px 6px 4px' }}>
          <div style={{ width: '34%', height: 5, background: '#0f172a', borderRadius: 2, opacity: 0.75, marginBottom: 5 }} />
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 4 }}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} style={section.variant === 'portrait' ? { aspectRatio: '3 / 4', background: '#e2e8f0', borderRadius: r } : { ...card, aspectRatio: '1 / 1', background: '#e2e8f0' }} />
            ))}
          </div>
        </div>
      );
    }
    case 'categories':
      return (
        <div style={{ padding: '8px 6px 0', display: 'flex', gap: 3 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: 14, height: 6, borderRadius: 6, background: i === 0 ? primary : '#fff', border: i === 0 ? undefined : '1px solid #cbd5e1' }} />
          ))}
        </div>
      );
    case 'imageText':
      return (
        <div style={{ padding: '8px 6px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, alignItems: 'center', direction: section.variant === 'right' ? 'rtl' : 'ltr' }}>
          <div style={{ aspectRatio: '4 / 3', background: '#e2e8f0', borderRadius: r + 1 }} />
          <div style={{ direction: 'ltr', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ width: '70%', height: 5, background: '#0f172a', borderRadius: 2, opacity: 0.75 }} />
            <Lines color={ink} widths={[95, 70]} />
          </div>
        </div>
      );
    case 'gallery':
      return (
        <div style={{ padding: '8px 6px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ aspectRatio: '1 / 1', background: '#e2e8f0', borderRadius: r }} />
          ))}
        </div>
      );
    case 'faq':
      return (
        <div style={{ margin: '8px 6px 0', ...card }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ padding: '4px 5px', borderTop: i ? '1px solid #e2e8f0' : undefined, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '60%', height: 3, background: ink, borderRadius: 2, opacity: 0.6 }} />
              <div style={{ width: 4, height: 4, borderRight: `1px solid ${ink}`, borderBottom: `1px solid ${ink}`, transform: 'rotate(45deg)' }} />
            </div>
          ))}
        </div>
      );
    case 'testimonials':
      return (
        <div style={{ padding: '8px 6px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ ...card, padding: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ width: 6, height: 4, background: primary, borderRadius: 1, opacity: 0.8 }} />
              <Lines color={ink} widths={[100, 80]} />
            </div>
          ))}
        </div>
      );
    case 'cta':
      return (
        <div style={{ margin: '8px 6px 0', background: primary, borderRadius: r + 2, padding: '8px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: '45%', height: 5, background: readableTextOn(primary), borderRadius: 2 }} />
          <div style={{ width: 22, height: 6, background: readableTextOn(primary), borderRadius: r, opacity: 0.9 }} />
        </div>
      );
    case 'socials':
      return (
        <div style={{ padding: '8px 6px 0', display: 'flex', gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: 8, background: '#fff', border: '1px solid #cbd5e1' }} />
          ))}
        </div>
      );
    case 'info':
      return (
        <div style={{ margin: '6px 6px 0', ...card, padding: 5, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <div style={{ width: 5, height: 5, borderRadius: 5, background: primary }} />
              <div style={{ flex: 1, height: 3, background: ink, borderRadius: 2, opacity: 0.55 }} />
            </div>
          ))}
        </div>
      );
  }
}

/** A tiny schematic of a storefront design (header, sections, footer) in its own colours, for the template picker. */
export default function DesignThumbnail({ design }: { design: StorefrontDesign }) {
  const primary = design.theme.primary;
  const centered = design.header.variant === 'centered';
  const darkFooter = design.footer.variant === 'dark';
  const sections = design.pages.home.sections.filter((s) => !s.hidden);
  // The announcement bar sits above everything, like on the live page (it renders under the header there).
  return (
    <div aria-hidden="true" className="flex aspect-[3/4] w-full flex-col overflow-hidden rounded-lg border bg-[#f8f9ff]">
      <div className="flex shrink-0 items-center gap-1.5 border-b bg-white px-2" style={{ height: 16, justifyContent: centered ? 'center' : 'space-between' }}>
        <div className="flex items-center gap-1">
          <div style={{ width: 7, height: 7, borderRadius: CORNER[design.theme.radius], background: primary }} />
          <div style={{ width: 22, height: 3, background: '#0f172a', borderRadius: 2, opacity: 0.75 }} />
        </div>
        {!centered && <div style={{ width: 10, height: 6, borderRadius: 3, background: primary }} />}
      </div>
      <div className="flex-1 overflow-hidden">
        {sections.map((s) => (
          <Block key={s.id} section={s} design={design} />
        ))}
      </div>
      <div className="shrink-0" style={{ height: 10, background: darkFooter ? '#091426' : '#fff', borderTop: darkFooter ? undefined : '1px solid #e2e8f0' }} />
    </div>
  );
}
