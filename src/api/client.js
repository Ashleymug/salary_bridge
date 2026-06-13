/**
 * Axios instance shared by all API modules.
 *
 * - Reads VITE_API_URL from the environment; falls back to '/api' so the
 *   Vite dev-server proxy handles it transparently.
 * - Attaches the JWT from localStorage to every request automatically.
 * - Clears the token and redirects to /login on any 401 response.
 */
import axios from 'axios';

export const TOKEN_KEY = 'salary_bridge_token';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach Bearer token ──────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle expired / invalid token ──────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // Only redirect if we are not already on the login page to avoid loops
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
