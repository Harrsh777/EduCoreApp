/**
 * Central Axios API client for School ERP mobile app.
 * All API calls must go through this client.
 * - Base URL from env
 * - Request interceptor: attach session token
 * - Response interceptor: 401 → logout and redirect
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from './env';
import { useAuthStore } from './auth-store';

const BASE_URL = env.API_BASE_URL || '';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/** Callback set by app root to redirect to login on 401 */
let onUnauthorized: (() => void) | null = null;

export function setApiUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

// Request: attach session token from store (or SecureStore via store)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().session_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Optional: send session cookie name if backend expects it
      config.headers['X-Session-Token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: 401 → logout and trigger redirect
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      await useAuthStore.getState().logout();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default api;
