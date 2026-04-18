import apiClient from './client';
import type { PagedOrders } from '@/types';

export const ordersApi = {
  getMyOrders: async (page = 0, size = 15): Promise<PagedOrders> => {
    const res = await apiClient.get('/business/orders', { params: { page, size } });
    return res.data;
  },
};
