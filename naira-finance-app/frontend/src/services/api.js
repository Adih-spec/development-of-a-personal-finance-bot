/**
 * src/services/api.js
 * Axios instance – attaches JWT token to every request
 */
import axios from 'axios';
import { getToken, removeToken, removeUser } from '../utils/storage';

// Change this to your computer's local IP when testing on a physical device
// e.g., 'http://192.168.1.100:5000/api'
export const BASE_URL = 'http://10.0.2.2:5000/api';   // Android emulator → localhost

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach token ─────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
      await removeUser();
      // AuthContext will detect missing token and redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
