import apiClient from './client';
import type { Category, CreateCategoryRequest } from '@/types';

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const res = await apiClient.get('/categories');
    return res.data;
  },

  create: async (data: CreateCategoryRequest): Promise<Category> => {
    const res = await apiClient.post('/admin/categories', data);
    return res.data;
  },

  update: async (id: number, data: CreateCategoryRequest): Promise<Category> => {
    const res = await apiClient.put(`/admin/categories/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`);
  },
};
