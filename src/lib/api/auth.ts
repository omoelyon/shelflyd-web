import apiClient from './client';
import type { LoginRequest, LoginResponse, RegisterRequest } from '@/types';

export const authApi = {
  register: async (data: RegisterRequest): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },
};
