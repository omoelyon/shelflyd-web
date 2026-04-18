import apiClient from './client';
import type { Business, UpdateSettingsRequest } from '@/types';

export const settingsApi = {
  getSettings: async (): Promise<Business> => {
    const res = await apiClient.get('/business/settings');
    return res.data;
  },

  updateSettings: async (dto: UpdateSettingsRequest): Promise<Business> => {
    const res = await apiClient.put('/business/settings', dto);
    return res.data;
  },

  uploadLogo: async (file: File): Promise<Business> => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post('/business/settings/logo/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
