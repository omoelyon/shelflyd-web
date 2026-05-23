import apiClient from './client';
import type { Product, PagedProducts, CreateProductRequest } from '@/types';

export const productsApi = {
  listAll: async (page = 0, size = 15, category?: string): Promise<PagedProducts> => {
    const res = await apiClient.get('/products', {
      params: { page, size, ...(category && { category }) },
    });
    return res.data;
  },

  getById: async (id: number): Promise<Product> => {
    const res = await apiClient.get(`/products/${id}`);
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

  adminListAll: async (page = 0, size = 15): Promise<PagedProducts> => {
    const res = await apiClient.get('/admin/products', { params: { page, size } });
    return res.data;
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post('/business/products/image/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
