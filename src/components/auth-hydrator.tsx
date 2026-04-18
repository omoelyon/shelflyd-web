'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { usersApi } from '@/lib/api/users';

export default function AuthHydrator() {
  const { token, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    usersApi
      .me()
      .then((user) => setUser(user))
      .catch(() => logout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return null;
}
