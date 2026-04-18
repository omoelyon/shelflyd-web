import apiClient from './client';
import type {
  Business,
  BusinessStats,
  RegisterBusinessRequest,
  UpdateBusinessStatusRequest,
  PagedProducts,
  PagedOrders,
  PagedPayments,
} from '@/types';

export const businessesApi = {
  // Public
  listAll: async (): Promise<Business[]> => {
    const res = await apiClient.get('/businesses');
    return res.data;
  },

  register: async (data: RegisterBusinessRequest): Promise<Business> => {
    const res = await apiClient.post('/businesses/register', data);
    return res.data;
  },

  // Owner
  getProfile: async (): Promise<Business> => {
    const res = await apiClient.get('/business/profile');
    return res.data;
  },

  getProducts: async (page = 0, size = 15): Promise<PagedProducts> => {
    const res = await apiClient.get('/business/products', { params: { page, size } });
    return res.data;
  },

  getOrders: async (page = 0, size = 15): Promise<PagedOrders> => {
    const res = await apiClient.get('/business/orders', { params: { page, size } });
    return res.data;
  },

  getPayments: async (page = 0, size = 15): Promise<PagedPayments> => {
    const res = await apiClient.get('/business/payments', { params: { page, size } });
    return res.data;
  },

  getStats: async (): Promise<BusinessStats> => {
    const res = await apiClient.get('/business/stats');
    return res.data;
  },

  // Admin
  adminListAll: async (): Promise<Business[]> => {
    const res = await apiClient.get('/admin/businesses');
    return res.data;
  },

  adminUpdateStatus: async (id: number, data: UpdateBusinessStatusRequest): Promise<Business> => {
    const res = await apiClient.patch(`/admin/businesses/${id}/status`, data);
    return res.data;
  },
};
