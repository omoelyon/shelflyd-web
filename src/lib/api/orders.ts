import apiClient from './client';
import type { Order, OrderItem, OrderStatus, PagedOrders } from '@/types';

export const ordersApi = {
  /** Business owner: orders for my business */
  getMyOrders: async (page = 0, size = 15): Promise<PagedOrders> => {
    const res = await apiClient.get('/business/orders', { params: { page, size } });
    return res.data;
  },

  /** Customer: all orders I placed across all businesses */
  getMyCustomerOrders: async (page = 0, size = 15): Promise<PagedOrders> => {
    const res = await apiClient.get('/orders/my-orders', { params: { page, size } });
    return res.data;
  },

  /** Customer: a single order I placed */
  getMyOrderById: async (id: number): Promise<Order> => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data;
  },

  /** Customer: line items for an order I placed */
  getMyOrderItems: async (id: number): Promise<OrderItem[]> => {
    const res = await apiClient.get(`/orders/${id}/items`);
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

  getItems: async (orderId: number): Promise<OrderItem[]> => {
    const res = await apiClient.get(`/business/orders/${orderId}/items`);
    return res.data;
  },

  adminList: async (page = 0, size = 20): Promise<PagedOrders> => {
    const res = await apiClient.get('/admin/orders', { params: { page, size } });
    return res.data;
  },
};
