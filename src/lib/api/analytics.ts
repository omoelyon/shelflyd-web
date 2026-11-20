import apiClient from './client';
import type { ProductAnalytics } from '@/types';

export const analyticsApi = {
  /** Most visited products for the last `days` days (seller dashboard). */
  getProductVisits: async (days = 7): Promise<ProductAnalytics> => {
    const res = await apiClient.get('/business/analytics/products', { params: { days } });
    return res.data;
  },

  /** Tells the server a shopper opened a product page. Fire-and-forget: a failure must never show to the shopper. */
  recordView: async (path: string): Promise<void> => {
    await apiClient.post(path);
  },
};
