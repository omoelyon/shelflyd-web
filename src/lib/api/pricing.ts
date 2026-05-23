import apiClient from './client';
import type { AddProductPriceRequest, PriceDetail } from '@/types';

export const pricingApi = {
  addPrice: async (productId: number, dto: AddProductPriceRequest): Promise<PriceDetail> => {
    const res = await apiClient.post(`/business/products/${productId}/price`, dto);
    return res.data;
  },

  deletePrice: async (priceId: number): Promise<void> => {
    await apiClient.delete(`/business/pricing/${priceId}`);
  },
};
