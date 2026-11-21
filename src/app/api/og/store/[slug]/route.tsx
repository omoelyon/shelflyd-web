import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { normalizeDesign, readableTextOn } from '@/lib/storefront/design';
import { STOREFRONT_DOMAIN } from '@/lib/storefront/url';
import { displayPrice, fetchProduct, fetchStore } from '@/lib/storefront/server';
import type { Product, StorefrontInfo } from '@/types';

/**
 * The share card drawn when a store or product link is pasted somewhere and the seller has no photo set: a 1200x630
 * picture with the store's colour, logo, name and description (or, for a product, its name and price). Only data the
 * public store API already returns is used, and nothing is taken from the URL but the store and product ids, so the
 * address can't be used to put arbitrary words on an image served from our domain.
 */

const SIZE = { width: 1200, height: 630 };
const CACHE = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

const clip = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

/** The colour mixed towards black, for the gradient's far corner. */
function darken(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  if (!/^#[0-9a-f]{6}$/i.test(hex) || Number.isNaN(n)) return '#0f172a';
  const channel = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount));
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

/** The logo as an embeddable picture, or null. Only small PNG/JPEG/GIF files over https are used (the renderer can't draw WebP), and a slow or broken logo never stops the card. */
async function loadLogo(url: string | null): Promise<string | null> {
  if (!url || !url.startsWith('https://')) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000), next: { revalidate: 3600 } });
    const type = res.headers.get('content-type')?.split(';')[0].trim() ?? '';
    if (!res.ok || !['image/png', 'image/jpeg', 'image/gif'].includes(type)) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > 1_000_000) return null;
    return `data:${type};base64,${Buffer.from(bytes).toString('base64')}`;
  } catch {
    return null;
  }
}

function Mark({ logo, name, size }: { logo: string | null; name: string; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: 'cover', borderRadius: size / 2 }} />
      ) : (
        <div style={{ display: 'flex', fontSize: size * 0.5, color: '#0f172a' }}>{(name.trim()[0] ?? 'S').toUpperCase()}</div>
      )}
    </div>
  );
}

function card(info: StorefrontInfo, primary: string, logo: string | null, host: string, product: Product | null) {
  const ink = readableTextOn(primary);
  const soft = ink === '#ffffff' ? 'rgba(255,255,255,0.82)' : 'rgba(15,23,42,0.75)';
  const price = product ? displayPrice(product) : null;
  const description = info.description?.trim() ?? '';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: `linear-gradient(135deg, ${primary}, ${darken(primary, 0.4)})`,
        color: ink,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Mark logo={logo} name={info.name} size={product ? 84 : 132} />
        {product && <div style={{ display: 'flex', fontSize: 34, fontWeight: 600, color: soft }}>{clip(info.name, 40)}</div>}
      </div>

      {product ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: 80, lineHeight: 1.05, letterSpacing: -2 }}>{clip(product.name, 48)}</div>
          {price && (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', fontSize: 66 }}>{price.plain}</div>
              <div style={{ display: 'flex', fontSize: 32, color: soft }}>{`per ${clip(price.unit, 20)}`}</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: 92, lineHeight: 1.05, letterSpacing: -2 }}>{clip(info.name, 40)}</div>
          {description ? <div style={{ display: 'flex', fontSize: 34, lineHeight: 1.35, color: soft }}>{clip(description, 130)}</div> : null}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 600, color: soft }}>{host}</div>
        <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: soft }}>Shop on Shelflyd</div>
      </div>
    </div>
  );
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const info = await fetchStore(slug);
  if (!info) return new Response('Store not found', { status: 404 });

  const productId = request.nextUrl.searchParams.get('product');
  const [logo, product] = await Promise.all([loadLogo(info.logo), productId ? fetchProduct(slug, productId) : Promise.resolve(null)]);
  const primary = normalizeDesign(info.design, info.themeColor).theme.primary;
  const host = info.customDomain ?? `${slug}.${STOREFRONT_DOMAIN}`;

  return new ImageResponse(card(info, primary, logo, host, product), { ...SIZE, headers: { 'Cache-Control': CACHE } });
}
