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

// Interceptor para añadir el token y x-user-id a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // El backend exige estos headers en todas las peticiones (según walkthrough)
  let userId = '0';
  let carreraId = '0';

  const user = readUserFromStorage();
  if (user) {
    const userIdFromStorage = readFirstNumberLike(user, ['id_usuario', 'id', 'user_id']);
    const careerFromStorage = readFirstNumberLike(user, ['id_carrera', 'carrera_id', 'idCarrera']);

    if (userIdFromStorage) userId = userIdFromStorage;
    if (careerFromStorage) carreraId = careerFromStorage;
  }

  if ((userId === '0' || carreraId === '0') && token) {
    const tokenPayload = decodeJwtPayload(token);
    if (tokenPayload) {
      if (userId === '0') {
        const userIdFromToken = readFirstNumberLike(tokenPayload, ['id_usuario', 'id', 'userId', 'sub']);
        if (userIdFromToken) userId = userIdFromToken;
      }

      if (carreraId === '0') {
        const careerFromToken = readFirstNumberLike(tokenPayload, ['id_carrera', 'carrera_id', 'careerId']);
        if (careerFromToken) carreraId = careerFromToken;
      }
    }
  }

  config.headers['x-user-id'] = userId;
  config.headers['x-user-carrera'] = carreraId;
  
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
