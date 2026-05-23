import apiClient from './client';
import type { DeliveryLocation, CreateDeliveryLocationRequest } from '@/types';

export const deliveryApi = {
  list: async (): Promise<DeliveryLocation[]> => {
    const res = await apiClient.get('/delivery-locations');
    return res.data;
  },

  listByBusiness: async (businessId: number): Promise<DeliveryLocation[]> => {
    const res = await apiClient.get(`/delivery-locations/business/${businessId}`);
    return res.data;
  },

  create: async (data: CreateDeliveryLocationRequest): Promise<DeliveryLocation> => {
    const res = await apiClient.post('/delivery-locations', data);
    return res.data;
  },

  update: async (id: number, data: CreateDeliveryLocationRequest): Promise<DeliveryLocation> => {
    const res = await apiClient.patch(`/delivery-locations/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/delivery-locations/${id}`);
  },
};
