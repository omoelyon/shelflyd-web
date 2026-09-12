import apiClient from './client';
import type { Product, PagedProducts, CreateProductRequest, UpdateProductRequest } from '@/types';

export const productsApi = {
  listAll: async (page = 0, size = 15, category?: string): Promise<PagedProducts> => {
    const res = await apiClient.get('/products', {
      params: { page, size, ...(category && { category }) },
    });
    return res.data;
  },

  getByUuid: async (uuid: string): Promise<Product> => {
    const res = await apiClient.get(`/products/${uuid}`);
    return res.data;
  },

  listByBusiness: async (businessId: number, page = 0, size = 15, category?: string): Promise<PagedProducts> => {
    const res = await apiClient.get(`/businesses/${businessId}/products`, {
      params: { page, size, ...(category && { category }) },
    });
    return res.data;
  },

  create: async (data: CreateProductRequest): Promise<Product> => {
    const res = await apiClient.post('/business/products', data);
    return res.data;
  },

  update: async (id: number, data: UpdateProductRequest): Promise<Product> => {
    const res = await apiClient.patch(`/business/products/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/business/products/${id}`);
  },

  adminListAll: async (page = 0, size = 15): Promise<PagedProducts> => {
    const res = await apiClient.get('/admin/products', { params: { page, size } });
    return res.data;
  },
};
