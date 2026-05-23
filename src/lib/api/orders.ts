import apiClient from './client';
import type { Order, OrderStatus, PagedOrders } from '@/types';

export const ordersApi = {
  getMyOrders: async (page = 0, size = 15): Promise<PagedOrders> => {
    const res = await apiClient.get('/business/orders', { params: { page, size } });
    return res.data;
  },

  getById: async (id: number): Promise<Order> => {
    const res = await apiClient.get(`/business/orders/${id}`);
    return res.data;
  },

  updateStatus: async (id: number, status: OrderStatus): Promise<Order> => {
    const res = await apiClient.patch(`/business/orders/${id}/status`, { status });
    return res.data;
  },

  adminList: async (page = 0, size = 20): Promise<PagedOrders> => {
    const res = await apiClient.get('/admin/orders', { params: { page, size } });
    return res.data;
  },
};
