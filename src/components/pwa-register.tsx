'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    // Production only: in development the cached `_next/static` files are not content-hashed, so the worker would keep serving old code.
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return null;
}
