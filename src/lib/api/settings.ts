import apiClient from './client';
import type { Business, DeliveryAddress, UpdateSettingsRequest } from '@/types';

export const settingsApi = {
  getSettings: async (): Promise<Business> => {
    const res = await apiClient.get('/business/settings');
    return res.data;
  },

  setPickupAddress: async (address: DeliveryAddress): Promise<Business> => {
    const res = await apiClient.patch('/business/settings/pickup-address', address);
    return res.data;
  },

  updateSettings: async (dto: UpdateSettingsRequest): Promise<Business> => {
    const res = await apiClient.put('/business/settings', dto);
    return res.data;
  },

  setLogoUrl: async (url: string): Promise<Business> => {
    const res = await apiClient.patch('/business/settings/logo', { url });
    return res.data;
  },

  generateLogo: async (): Promise<Business> => {
    const res = await apiClient.post('/business/settings/logo/generate');
    return res.data;
  },

  removeLogo: async (): Promise<Business> => {
    const res = await apiClient.delete('/business/settings/logo');
    return res.data;
  },
};
