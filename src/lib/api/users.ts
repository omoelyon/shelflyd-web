import apiClient from './client';
import type { User } from '@/types';

export const usersApi = {
  me: async (): Promise<User> => {
    const res = await apiClient.get('/users/profile');
    return res.data;
  },
};

export const adminUsersApi = {
  list: async (): Promise<User[]> => {
    const res = await apiClient.get('/admin/users');
    return res.data;
  },
};
