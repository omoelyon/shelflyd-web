import axios from 'axios';

// SHF-15: no Authorization header is attached here — the session lives only in the
// httpOnly cookie set by /api/auth/set-cookie. Every request below is same-origin
// (proxied by next.config.ts's rewrite to the backend), so the browser sends that
// cookie automatically; the backend's JwtAuthenticationFilter already accepts it as a
// fallback when no Authorization header is present. Verified live: a request with only
// the cookie (no header at all) authenticates correctly through the rewrite.
const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// A 401 means the session cookie is missing or expired server-side — bounce to login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
