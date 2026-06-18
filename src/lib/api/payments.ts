import apiClient from './client';
import type { PagedPayments } from '@/types';

export const paymentsApi = {
  getMyTransactions: async (page = 0, size = 15): Promise<PagedPayments> => {
    const res = await apiClient.get('/transactions', { params: { page, size } });
    return res.data;
  },

  /** Admin: all platform transactions */
  adminList: async (page = 0, size = 20): Promise<PagedPayments> => {
    const res = await apiClient.get('/transactions', { params: { page, size } });
    return res.data;
  },
};
