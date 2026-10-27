import apiClient from './client';
import type { CartResponse, Order, OrderItem, OrderStatus, PagedOrders, PatronizedBusiness, PickupPass, Shipment } from '@/types';

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

  /** Customer: courier shipment (if any) for an order I placed */
  getMyOrderShipment: async (id: number): Promise<Shipment | null> => {
    const res = await apiClient.get(`/orders/${id}/shipment`);
    return res.data;
  },

  /** Customer: pickup code for a PICKUP order I placed */
  getMyPickupPass: async (id: number): Promise<PickupPass> => {
    const res = await apiClient.get(`/orders/${id}/pickup-pass`);
    return res.data;
  },

  /** Customer: the pickup pass as a shareable image (QR + code) */
  getMyPickupPassImage: async (id: number): Promise<Blob> => {
    const res = await apiClient.get(`/orders/${id}/pickup-pass.png`, { responseType: 'blob' });
    return res.data;
  },

  /** Customer: re-add every item from a past order into that business's cart */
  reorder: async (id: number): Promise<CartResponse> => {
    const res = await apiClient.post(`/orders/${id}/reorder`);
    return res.data;
  },

  /** Customer: every business I've ordered from at least once, most recent first */
  getMyPatronizedBusinesses: async (): Promise<PatronizedBusiness[]> => {
    const res = await apiClient.get('/orders/my-orders/businesses');
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

  /** Business owner: hand over a pickup order after checking the buyer's code */
  verifyPickup: async (id: number, code: string): Promise<Order> => {
    const res = await apiClient.post(`/business/orders/${id}/pickup/verify`, { code });
    return res.data;
  },

  getItems: async (orderId: number): Promise<OrderItem[]> => {
    const res = await apiClient.get(`/business/orders/${orderId}/items`);
    return res.data;
  },

  /** Business owner: courier shipment (if any) for an order on my business */
  getShipment: async (orderId: number): Promise<Shipment | null> => {
    const res = await apiClient.get(`/business/orders/${orderId}/shipment`);
    return res.data;
  },

  adminList: async (page = 0, size = 20): Promise<PagedOrders> => {
    const res = await apiClient.get('/admin/orders', { params: { page, size } });
    return res.data;
  },
};
