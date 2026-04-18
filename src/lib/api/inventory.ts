import apiClient from './client';
import type { Inventory, CreateInventoryRequest } from '@/types';

export const inventoryApi = {
  get: async (productId: number): Promise<Inventory> => {
    const res = await apiClient.get(`/inventories/product/${productId}`);
    return res.data;
  },

  create: async (data: CreateInventoryRequest): Promise<Inventory> => {
    const res = await apiClient.post('/inventories', data);
    return res.data;
  },

  update: async (productId: number, quantity: number): Promise<Inventory> => {
    const res = await apiClient.patch(`/inventories/product/${productId}`, { quantity });
    return res.data;
  },
};
