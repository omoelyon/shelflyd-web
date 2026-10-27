import apiClient from './client';
import type { EarningsSummary, PagedEarnings } from '@/types';

export const earningsApi = {
  /** Owner: totals of what the seller has earned from paid orders */
  getSummary: async (): Promise<EarningsSummary> => {
    const res = await apiClient.get('/business/earnings/summary');
    return res.data;
  },

  /** Owner: what the seller received for each paid order, newest first */
  getTransactions: async (page = 0, size = 15): Promise<PagedEarnings> => {
    const res = await apiClient.get('/business/earnings/transactions', { params: { page, size } });
    return res.data;
  },

  /** Owner: download every earning as a CSV file */
  exportCsv: async (): Promise<void> => {
    const res = await apiClient.get('/business/earnings/export', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shelflyd-earnings.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
