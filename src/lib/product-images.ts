/** The most photos one product can have. Mirrors ProductImages.MAX on the server. */
export const MAX_PRODUCT_IMAGES = 5;

/**
 * A product's photos in order, cover first. Products saved before multiple photos existed only have `image`,
 * so this falls back to it; the server already does the same, this just keeps older cached data safe.
 */
export function productImages(product: { image?: string | null; images?: string[] | null }): string[] {
  const list = (product.images ?? []).filter(Boolean);
  if (list.length > 0) return list;
  return product.image ? [product.image] : [];
}
