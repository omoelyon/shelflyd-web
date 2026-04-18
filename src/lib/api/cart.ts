import apiClient from './client';
import type { CartResponse, CartUpdateRequest, CheckoutRequest, CheckoutResponse } from '@/types';

export const cartApi = {
  getAll: async (): Promise<CartResponse[]> => {
    const res = await apiClient.get('/carts');
    return res.data;
  },

  getByBusiness: async (businessId: number): Promise<CartResponse> => {
    const res = await apiClient.get(`/carts/business/${businessId}`);
    return res.data;
  },

  add: async (data: CartUpdateRequest): Promise<CartResponse> => {
    const res = await apiClient.put('/carts/add', data);
    return res.data;
  },

  remove: async (data: CartUpdateRequest): Promise<CartResponse> => {
    const res = await apiClient.put('/carts/remove', data);
    return res.data;
  },

  removeProduct: async (productId: number): Promise<CartResponse> => {
    const res = await apiClient.put(`/carts/product/${productId}/remove`);
    return res.data;
  },

  checkout: async (data: CheckoutRequest): Promise<CheckoutResponse> => {
    const res = await apiClient.post('/carts/checkout', data);
    return res.data;
  },
};
