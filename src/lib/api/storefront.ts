import apiClient from './client';
import type { StorefrontInfo, Product, PagedProducts, DeliveryLocation } from '@/types';

export const storefrontApi = {
  getInfo: async (slug: string): Promise<StorefrontInfo> => {
    const res = await apiClient.get(`/storefront/${slug}`);
    return res.data;
  },

  getProducts: async (slug: string, page = 0, size = 20): Promise<PagedProducts> => {
    const res = await apiClient.get(`/storefront/${slug}/products`, { params: { page, size } });
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
