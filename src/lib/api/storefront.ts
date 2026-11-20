import apiClient from './client';
import type { StorefrontInfo, Product, PagedProducts, DeliveryLocation } from '@/types';

/** A category this store's products use (for the category chips). */
export interface StoreCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  productCount: number;
}

export const storefrontApi = {
  /** The store's details and published design. With a valid private preview token it returns the saved draft instead. */
  getInfo: async (slug: string, previewToken?: string | null): Promise<StorefrontInfo> => {
    const res = await apiClient.get(`/storefront/${slug}`, { params: previewToken ? { preview: previewToken } : undefined });
    return res.data;
  },

  getProducts: async (slug: string, page = 0, size = 20, category?: string): Promise<PagedProducts> => {
    const res = await apiClient.get(`/storefront/${slug}/products`, {
      params: { page, size, ...(category && { category }) },
    });
    return res.data;
  },

  /** The categories this store's active products use. */
  getCategories: async (slug: string): Promise<StoreCategory[]> => {
    const res = await apiClient.get(`/storefront/${slug}/categories`);
    return res.data;
  },

  /** Hand-picked products for a featured section, in the order of `ids` (unknown or removed ones are skipped). */
  getFeatured: async (slug: string, ids: number[]): Promise<Product[]> => {
    const res = await apiClient.get(`/storefront/${slug}/products/featured`, { params: { ids: ids.join(',') } });
    return res.data;
  },

  getProduct: async (slug: string, productId: number): Promise<Product> => {
    const res = await apiClient.get(`/storefront/${slug}/products/${productId}`);
    return res.data;
  },

  getDeliveryLocations: async (slug: string): Promise<DeliveryLocation[]> => {
    const res = await apiClient.get(`/storefront/${slug}/delivery-locations`);
    return res.data;
  },
};
