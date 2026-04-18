import apiClient from './client';
import type { DeliveryLocation, CreateDeliveryLocationRequest } from '@/types';

export const deliveryApi = {
  list: async (): Promise<DeliveryLocation[]> => {
    const res = await apiClient.get('/delivery-locations');
    return res.data;
  },

  create: async (data: CreateDeliveryLocationRequest): Promise<DeliveryLocation> => {
    const res = await apiClient.post('/delivery-locations', data);
    return res.data;
  },
};
