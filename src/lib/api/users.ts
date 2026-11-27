import apiClient from './client';
import type { SpringPage, User } from '@/types';

export const usersApi = {
  me: async (): Promise<User> => {
    const res = await apiClient.get('/users/profile');
    return res.data;
  },
};

/** One row of the staff user list. */
export interface AdminUserRow {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  admin: boolean;
  /** ISO timestamp */
  createdAt: string | null;
}

export const adminUsersApi = {
  /** Users newest first, a page at a time; `q` matches name, email or phone. */
  list: async (page = 0, size = 25, q = ''): Promise<SpringPage<AdminUserRow>> => {
    const res = await apiClient.get('/admin/users', { params: { page, size, ...(q.trim() ? { q: q.trim() } : {}) } });
    return res.data;
  },
};
