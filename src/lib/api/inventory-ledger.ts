import apiClient from './client';
import type { AdjustStockRequest, AdjustStockResult, MovementsQuery, PagedStockMovements, StockCover } from '@/types/inventory';

/** The stock ledger, stock cover (how many days of stock are left) and manual stock changes. */
export const inventoryLedgerApi = {
  cover: async (): Promise<StockCover> => {
    const res = await apiClient.get('/business/inventory/cover');
    return res.data;
  },

  movements: async (query: MovementsQuery = {}): Promise<PagedStockMovements> => {
    const { productId, type, from, to, page = 0, size = 20 } = query;
    const res = await apiClient.get('/business/inventory/movements', {
      params: { page, size, ...(productId && { productId }), ...(type && { type }), ...(from && { from }), ...(to && { to }) },
    });
    return res.data;
  },

  adjust: async (productId: number, body: AdjustStockRequest): Promise<AdjustStockResult> => {
    const res = await apiClient.post(`/business/inventory/${productId}/adjust`, body);
    return res.data;
  },
};
