import apiClient from './client';
import type { PagedPayments, PaymentSummary } from '@/types';

export const paymentsApi = {
  getMyTransactions: async (page = 0, size = 15): Promise<PagedPayments> => {
    const res = await apiClient.get('/transactions', { params: { page, size } });
    return res.data;
  },

  getByReference: async (reference: string): Promise<{ businessId: number; cartId: number }> => {
    const res = await apiClient.get(`/payments/reference/${reference}`);
    return res.data;
  },

  /**
   * Re-checks a payment directly with its gateway and completes order processing if it's
   * genuinely paid. Safe to call even if the webhook already did this — it's a no-op then.
   */
  resync: async (reference: string): Promise<{ status: string; paid: boolean }> => {
    const res = await apiClient.post(`/payments/reference/${reference}/resync`);
    return res.data;
  },

  /** Admin: all platform transactions */
  adminList: async (page = 0, size = 20): Promise<PagedPayments> => {
    const res = await apiClient.get('/transactions', { params: { page, size } });
    return res.data;
  },

  /** Admin: paid vs. still-pending attempt counts across the whole platform */
  adminSummary: async (): Promise<PaymentSummary> => {
    const res = await apiClient.get('/transactions/summary');
    return res.data;
  },
};
