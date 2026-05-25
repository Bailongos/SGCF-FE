// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

function readUserFromStorage(): any | null {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) return null;

  try {
    const parsed = JSON.parse(savedUser);
    return parsed?.user ?? parsed?.usuario ?? parsed ?? null;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function readFirstNumberLike(source: any, keys: string[]): string | null {
  for (const key of keys) {
    const value = source?.[key];
    if (value === null || value === undefined || value === '') continue;

    const num = Number(value);
    if (!Number.isNaN(num)) return String(num);
  }

  return null;
}

// Interceptor para añadir el token a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  
  return config;
});

// Interceptor para manejar errores globales (ej: 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url ?? '');
    const isAuthSignInRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/google') ||
      requestUrl.includes('/auth/microsoft');
    
    if (error.response?.status === 401 && !isAuthSignInRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
