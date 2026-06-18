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

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (data: {
    email: string;
    otp: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  },
};
